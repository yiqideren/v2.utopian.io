const Axios = require('axios')
const dsteem = require('dsteem')

const steemClient = new dsteem.Client(process.env.STEEM_API || 'https://api.steemit.com')

const getSteemConnectTokens = async (code) => {
  const response = await Axios({
    headers: {
      'Accept': 'application/json'
    },
    method: 'post',
    url: 'https://steemconnect.com/api/oauth2/token',
    data: {
      code,
      client_secret: `${process.env.STEEMCONNECT_CLIENT_SECRET}`
    }
  })
  if (response.status === 200 && response.data) {
    return response.data
  }

  return null
}

const getSteemAccounts = (accounts) => steemClient.database.getAccounts(accounts)

const isRunningOnTestnet = () => (process.env.TESTNET === true || process.env.TESTNET === 'true')

const createSteemAccountOperation = ({ username, ownerAuth, activeAuth, postingAuth, memoAuth }) => {
  let creator, creatorKey, creatorPassword

  if (isRunningOnTestnet()) {
    ownerAuth.key_auths[0][0] = ownerAuth.key_auths[0][0].replace('STM', 'STX')
    activeAuth.key_auths[0][0] = activeAuth.key_auths[0][0].replace('STM', 'STX')
    postingAuth.key_auths[0][0] = postingAuth.key_auths[0][0].replace('STM', 'STX')
    memoAuth.key_auths[0][0] = memoAuth.key_auths[0][0].replace('STM', 'STX')

    creator = process.env.ACCOUNT_CREATOR_TESTNET
    creatorPassword = process.env.ACCOUNT_CREATOR_PASSWORD_TESTNET
    creatorKey = dsteem.PrivateKey.fromLogin(String(creator), String(creatorPassword))
  } else {
    creator = process.env.ACCOUNT_CREATOR
    creatorPassword = process.env.ACCOUNT_CREATOR_ACTIVE_KEY
    creatorKey = dsteem.PrivateKey.from(String(creatorPassword))
  }

  const createOp = [
    'create_claimed_account',
    {
      creator,
      new_account_name: username,
      owner: ownerAuth,
      active: activeAuth,
      posting: postingAuth,
      memo_key: memoAuth.key_auths[0][0],
      json_metadata: '',
      extensions: []
    }
  ]

  return steemClient.broadcast.sendOperations([createOp], creatorKey)
}

module.exports = {
  createSteemAccountOperation,
  steemClient,
  getSteemAccounts,
  getSteemConnectTokens
}
