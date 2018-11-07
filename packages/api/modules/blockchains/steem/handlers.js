const Boom = require('boom')
const User = require('../../users/user.model')
const { getSteemConnectTokens, getSteemAccounts, steemClient, dsteem } = require('../../../utils/blockchains/steem')
const { encrypt } = require('../../../utils/security')

const linkSteemAccount = async (req, h) => {
  const user = await User.findOne({ username: req.auth.credentials.username })
  if (user) {
    const tokens = await getSteemConnectTokens(req.payload.code)
    if (user.blockchainAccounts.some((account) => account.blockchain === 'steem' && account.address === tokens.username)) {
      throw Boom.badData('account-already-linked')
    }

    user.blockchainAccounts.push({
      blockchain: 'steem',
      address: tokens.username,
      active: (user.blockchainAccounts || []).length === 0
    })
    const response = await User.updateOne(
      { username: req.auth.credentials.username },
      { blockchainAccounts: user.blockchainAccounts }
    )
    if (response.n === 1) {
      return h.response({
        data: {
          message: 'link-account-success',
          username: tokens.username,
          accessToken: encrypt(tokens.access_token),
          refreshToken: encrypt(tokens.refresh_token)
        }
      })
    }
  }

  throw Boom.badData('document-does-not-exist')
}

const isSteemUsernameAvailable = async (req, h) => {
  const accounts = await getSteemAccounts([req.params.username])
  if (accounts.length > 0) {
    return h.response({ data: { available: false } })
  }

  return h.response({ data: { available: true } })
}

const createSteemAccount = async (req, h) => {
  const { username, ownerAuth, activeAuth, postingAuth, memoAuth } = req.payload

  const user = await User.findOne({ username: req.auth.credentials.username })

  if (user) {
    if (user.hasCreatedSteemAccount) throw Boom.badData('user-already-created-steem-account')

    // CHANGE PREFIX FOR TESTNET
    if (process.env.TESTNET === true) {
      ownerAuth.key_auths[0][0] = ownerAuth.key_auths[0][0].replace('STM', 'STX')
      activeAuth.key_auths[0][0] = activeAuth.key_auths[0][0].replace('STM', 'STX')
      postingAuth.key_auths[0][0] = postingAuth.key_auths[0][0].replace('STM', 'STX')
      memoAuth.key_auths[0][0] = memoAuth.key_auths[0][0].replace('STM', 'STX')
    }

    const creator = process.env.TESTNET === true ? process.env.ACCOUNT_CREATOR_TESTNET : process.env.ACCOUNT_CREATOR
    const creatorPassword = process.env.TESTNET === true ? process.env.ACCOUNT_CREATOR_PASSWORD_TESTNET : process.env.ACCOUNT_CREATOR_ACTIVE_KEY
    const creatorKey = process.env.TESTNET === true
      ? dsteem.PrivateKey.fromLogin(String(creator), String(creatorPassword), 'active')
      : dsteem.PrivateKey.from(String(creatorPassword))

    // the create discounted account operation
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

    console.log(createOp)
    const steemResult = await steemClient.broadcast.sendOperations([createOp], creatorKey)
    console.log(steemResult)
    return h.response({
      data: steemResult
    })
    // user.steem_account = account_name
    // user.hasCreatedSteemAccount = true
    // await user.save()

    // let new_user = await create_new_user(user)
    // if(new_user) { res.status(200).send({ message: "Account has been created.", user: user}) }
    // else { res.status(500).json({ message: `We couldn't create your account. Please contact us on discord!`}) }
  }
}

module.exports = {
  createSteemAccount,
  isSteemUsernameAvailable,
  linkSteemAccount
}
