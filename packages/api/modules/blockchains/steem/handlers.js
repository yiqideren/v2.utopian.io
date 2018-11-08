const Boom = require('boom')
const User = require('../../users/user.model')
const { getSteemConnectTokens, getSteemAccounts, createSteemAccountOperation } = require('../../../utils/blockchains/steem')
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
  const user = await User.findOne({ username: req.auth.credentials.username })
  const steemAccount = req.payload.username

  if (user) {
    if (user.hasCreatedSteemAccount) throw Boom.badData('user-already-created-steem-account')
    try {
      const steemResult = await createSteemAccountOperation(req.payload)

      // Link steem account to user in database
      user.blockchainAccounts.push({
        blockchain: 'steem',
        address: steemAccount,
        active: (user.blockchainAccounts || []).length === 0
      })

      User.updateOne({
        username: req.auth.credentials.username
      }, {
        blockchainAccounts: user.blockchainAccounts,
        hasCreatedSteemAccount: true
      })

      return h.response({
        data: steemResult
      })
    } catch (err) {
      // This log is necessary to check if the operation is being called correctly even if the user can't claim accounts
      // console.err(err)
      throw Boom.badData('could-not-create-account')
    }
  }

  throw Boom.badData('document-does-not-exist')
}

module.exports = {
  createSteemAccount,
  isSteemUsernameAvailable,
  linkSteemAccount
}
