const Axios = require('axios')
const dsteem = require('dsteem')

const steemClient = new dsteem.Client(process.env.STEEM_API)

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

module.exports = {
  dsteem,
  steemClient,
  getSteemAccounts,
  getSteemConnectTokens
}
