import API from 'src/plugins/api'
import * as dsteem from 'dsteem'
import * as randomBytes from 'randombytes'

export const isSteemUsernameAvailable = async (context, username) => {
  const payload = await API.call({
    context,
    method: 'get',
    url: `/v1/blockchains/steem/${username}/available`
  })

  return payload.available
}

export const createSteemAccount = async (context, data) => {
  const payload = await API.call({
    context,
    method: 'post',
    url: `/v1/blockchains/steem/account`,
    data
  })

  return payload
}

export const generatePassword = () => randomBytes(32).toString('hex')

export const generateAuthFromKeys = (context, keys) => {
  const auth = {}
  for (let key in keys) {
    auth[key.split('Key')[0] + 'Auth'] = {
      weight_threshold: 1,
      account_auths: [],
      key_auths: [
        [keys[key].createPublic(), 1]
      ]
    }
  }

  return auth
}

export const generatePrivateKeysFromPassword = (context, { username, password }) => {
  const keys = {}
  keys.ownerKey = dsteem.PrivateKey.fromLogin(username, password, 'owner')
  keys.activeKey = dsteem.PrivateKey.fromLogin(username, password, 'active')
  keys.postingKey = dsteem.PrivateKey.fromLogin(username, password, 'posting')
  keys.memoKey = dsteem.PrivateKey.fromLogin(username, password, 'memo')

  return keys
}
