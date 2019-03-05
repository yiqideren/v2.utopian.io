import { Client, PrivateKey, PublicKey } from 'dsteem'
import steemjs from '@steemit/steem-js'

export default ({ Vue }) => {
  console.log(process)
  console.log('PID', process.pid)
  Vue.prototype.$steem = {
    Client: new Client(process.env.STEEM_API, {
      addressPrefix: process.env.STEEM_ADDRESS_PREFIX
    }),
    PrivateKey,
    PublicKey
  }
  Vue.prototype.$steemjs = steemjs
}
