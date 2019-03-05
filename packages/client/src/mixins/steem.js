import aesjs from 'aes-js'
import { mapActions, mapGetters } from 'vuex'
import { date } from 'quasar'

const { addToDate } = date

/**
 * Add this mixin to your page if it requires an active steem account
 */
export const SteemAccountRequired = {
  computed: {
    ...mapGetters('auth', ['steemEnabled'])
  },
  watch: {
    steemEnabled: function (value) {
      if (value === false) {
        this.$router.push({ path: `/${this.$route.params.locale}/profile/steem` })
      }
    }
  }
}

/**
 * Add this mixin to your page if you need to broadcast content
 */
export const SteemPost = {
  methods: {
    ...mapActions('users', ['getEncryptionKey']),
    ...mapActions('utils', ['setAppError']),
    /**
     * Parse html to MD
     * Append a footer link to redirect users back to utopian
     *
     * @param body {string} - post content
     * @param url {string} - return url to utopian
     *
     * @returns {string} - parsed body and appended url
     *
     * @author Grégory LATINIER
     */
    parsePostBody ({ body, url }) {
      return `${this.$turndown.turndown(body)}\n\n[${this.$t('mixins.steem.postFooter')}](${window.location.protocol}//${window.location.host}${url})`
    },
    /**
     * Publish content to the Steem blockchain
     *
     * @param body
     * @param permlink
     * @param tags
     * @param title
     * @param url
     * @param blockchain - existing publication
     * @param context - what is being published
     * @param category
     *
     * @returns blockchain data with transaction IDs
     *
     * @author Grégory LATINIER
     */
    async post ({ body, permlink, tags, title, url, blockchain, context, category }) {
      try {
        const accounts = JSON.parse(localStorage.blockchainAccounts)
        const encryptionKey = await this.getEncryptionKey()
        const key = aesjs.utils.utf8.toBytes(encryptionKey)
        const iv = aesjs.utils.utf8.toBytes(localStorage.iv)
        // eslint-disable-next-line
        const aesCbc = new aesjs.ModeOfOperation.cbc(key, iv)
        const encryptedBytes = aesjs.utils.hex.toBytes(accounts[0].encryptedKey)
        const decryptedBytes = aesCbc.decrypt(encryptedBytes)
        const postingKey = aesjs.utils.utf8.fromBytes(decryptedBytes).substr(3).trim()
        const privateKey = this.$steem.PrivateKey.fromString(postingKey)
        const author = accounts[0].address
        const jsonMetadata = JSON.stringify({ app: 'utopian.io', format: 'markdown', tags })
        const parentPermlink = 'utopian-io'
        let transaction
        if (!blockchain) {
          const beneficiaries = await getBeneficiairies({ context })
          transaction = await this.$steem.Client.broadcast.commentWithOptions(
            {
              author,
              body: this.parsePostBody({ body, url }),
              json_metadata: jsonMetadata,
              parent_author: '',
              parent_permlink: parentPermlink,
              permlink,
              title
            }, {
              author,
              permlink,
              max_accepted_payout: '1000000.000 SBD',
              percent_steem_dollars: getPercentSteemDollars(context),
              allow_votes: true,
              allow_curation_rewards: true,
              extensions: [
                [0, { beneficiaries }]
              ]
            },
            privateKey)
          return {
            author,
            parentPermlink,
            permlink,
            transaction
          }
        } else {
          // TODO diff patch?
          transaction = await this.$steem.Client.broadcast.comment(
            {
              author,
              body: this.parsePostBody({ body, url }),
              json_metadata: jsonMetadata,
              parent_author: '',
              parent_permlink: blockchain.data.parentPermlink,
              permlink: blockchain.data.permlink,
              title
            },
            privateKey)
          return {
            author,
            parentPermlink: blockchain.data.parentPermlink,
            permlink: blockchain.data.permlink,
            transaction
          }
        }
      } catch (e) {
        // TODO display a more precise message for other cases, blockchain related
        if (e.toString().includes('Non-base58 character')) {
          this.setAppError(this.$t('mixins.steem.errors.keys'))
        } else if (e.toString().includes('STEEM_MIN_ROOT_COMMENT_INTERVAL')) {
          this.setAppError(this.$t('mixins.steem.errors.STEEM_MIN_ROOT_COMMENT_INTERVAL'))
        } else {
          this.setAppError(this.$t('mixins.steem.errors.unexpected'))
        }

        return null
      }
    },
    getSteemitUrl () {
      const { data } = this.blockchains.find(b => b.name === 'steem')
      return `https://steemit.com/${data.parentPermlink}/@${data.author}/${data.permlink}`
    }
  }
}

// FULL STEEM POWER scale value from 10000 to 0 (10000 == 100%)
const getPercentSteemDollars = (context) => {
  switch (context) {
    case 'article':
      return 5000
    case 'bounty':
      return 10000
    default:
      return 5000
  }
}

// TODO dynamic beneficiaries depending on the category
const getBeneficiairies = async ({ context }) => {
  if (context === 'article') {
    return [{ account: 'utopian.pay', weight: 500 }]
  } else if (context === 'bounty') {
    return [{ account: 'utopian.pay', weight: 10000 }]
  } else if (context === 'bounty-solution') {
    return [{ account: 'utopian.pay', weight: 1500 }]
  }
}

export const SteemTransfer = {
  computed: {
    ...mapGetters('auth', ['steemEnabled'])
  },
  methods: {
    ...mapActions('utils', ['setAppError']),
    async isActiveKeyValid (key) {
      const accounts = JSON.parse(localStorage.blockchainAccounts)
      if (!this.$steemjs.auth.isWif(key)) {
        return false
      }
      const account = (await this.$steemjs.api.getAccountsAsync([accounts[0].address])).find(u => u.name === accounts[0].address)
      return this.$steemjs.auth.wifIsValid(key, account['active']['key_auths'][0][0])
    },
    async loadAccountFunds () {
      const accounts = JSON.parse(localStorage.blockchainAccounts)
      const account = (await this.$steemjs.api.getAccountsAsync([accounts[0].address])).find(u => u.name === accounts[0].address)
      if (account) {
        return {
          address: account.name,
          steem: account.balance,
          sbd: account.sbd_balance,
          sp: account.vesting_shares
        }
      }
      return null
    },
    getSteemSenderUser () {
      const accounts = JSON.parse(localStorage.blockchainAccounts)
      return accounts[0].address
    },
    async transfer ({ steem, sbd, key, from, to, url }) {
      const memo = `${this.$t('mixins.steem.memoTip')} ${window.location.protocol}//${window.location.host}${url}`
      const operations = []
      if (steem) {
        operations.push([
          'transfer',
          {
            amount: `${steem} STEEM`,
            from,
            to,
            memo
          }
        ])
      }
      if (sbd) {
        operations.push([
          'transfer',
          {
            amount: `${sbd} SBD`,
            from,
            to,
            memo
          }
        ])
      }
      try {
        const transaction = await this.$steemjs.broadcast.sendAsync({
          extensions: [],
          operations
        }, [key])
        return {
          blockchain: 'steem',
          id: transaction.id,
          block: transaction.block_num
        }
      } catch (e) {
        // TODO display a more precise message for other cases, blockchain related
        console.log(e)
        this.setAppError(this.$t('mixins.steem.errors.unexpected'))
      }
    }
  }
}

export const SteemEscrow = {
  methods: {
    ...mapActions('utils', ['setAppError']),
    async isActiveKeyValid (key) {
      const accounts = JSON.parse(localStorage.blockchainAccounts)
      if (!this.$steemjs.auth.isWif(key)) {
        return false
      }
      const account = (await this.$steemjs.api.getAccountsAsync([accounts[0].address])).find(u => u.name === accounts[0].address)
      return this.$steemjs.auth.wifIsValid(key, account['active']['key_auths'][0][0])
    },
    async escrowTransfer ({ key, sender, receiver, bounty }) {
      try {
        const ratificationDeadline = addToDate(new Date(), { days: 2 })
        const escrowExpiration = new Date(bounty.deadline)
        // TODO date control
        const operations = []
        const escrowId = parseInt(Math.random() * (99999999 - 10000000) + 10000000)
        operations.push([
          'escrow_transfer',
          {
            from: sender,
            to: receiver,
            agent: process.env.ESCROW_ACCOUNT,
            escrow_id: escrowId,
            sbd_amount: `${parseFloat(bounty.amount[0].amount).toFixed(3)} SBD`,
            steem_amount: '0.000 STEEM',
            fee: `${(parseFloat(bounty.amount[0].amount) * 5 / 100).toFixed(3)} SBD`,
            ratification_deadline: ratificationDeadline.toISOString().slice(0, -5),
            escrow_expiration: escrowExpiration.toISOString().slice(0, -5),
            json_meta: JSON.stringify({
              bounty: window.location.href
            })
          }
        ])
        const transaction = await this.$steemjs.broadcast.sendAsync({
          extensions: [],
          operations
        }, [key])
        return {
          escrowId,
          transaction: {
            id: transaction.id,
            block: transaction.block_num
          }
        }
      } catch (e) {
        // TODO display a more precise message for other cases, blockchain related
        console.log(e)
        this.setAppError(this.$t('mixins.steem.errors.unexpected'))
      }
    }
  }
}
