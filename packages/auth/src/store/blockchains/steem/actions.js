import API from 'src/plugins/api'

export const isSteemUsernameAvailable = async (context, username) => {
  const payload = await API.call({
    context,
    method: 'get',
    url: `/v1/blockchains/steem/${username}/available`
  })

  return payload.available
}
