const Handlers = require('./handlers')
const Validate = require('./validate')

const routes = []
routes.push([
  {
    method: 'PUT',
    path: '/v1/blockchains/steem/linkaccount',
    handler: (req, h, next) => Handlers.linkSteemAccount(req, h, next),
    options: {
      tags: ['api', 'blockchains', 'steem'],
      validate: Validate.linkSteemAccount
    }
  },
  {
    method: 'GET',
    path: '/v1/blockchains/steem/{username}/available',
    handler: (req, h, next) => Handlers.isSteemUsernameAvailable(req, h, next),
    options: {
      auth: false,
      tags: ['api', 'blockchains', 'steem'],
      validate: Validate.isSteemUsernameAvailable
    }
  }
])
module.exports = routes
