import API from 'src/plugins/api'

export const isSteemUsernameAvailable = async (context, username) => {
  const payload = await API.call({
    context,
    method: 'get',
    url: `/v1/blockchains/steem/account/${username}/available`
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
