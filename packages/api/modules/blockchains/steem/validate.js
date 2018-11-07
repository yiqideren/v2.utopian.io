const Joi = require('joi')

const linkSteemAccount = {
  payload: {
    code: Joi.string().trim().required()
  }
}

const isSteemUsernameAvailable = {
  params: {
    username: Joi.string().trim().lowercase().required().min(3).max(32).regex(/^[A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)*$/)
  }
}

const createSteemAccount = {
  payload: {
    username: Joi.string().trim().lowercase().required().min(3).max(32).regex(/^[A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)*$/),
    ownerAuth: Joi.object(),
    activeAuth: Joi.object(),
    postingAuth: Joi.object(),
    memoAuth: Joi.object()
  }
}

module.exports = {
  createSteemAccount,
  isSteemUsernameAvailable,
  linkSteemAccount
}
