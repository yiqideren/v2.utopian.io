<script>
import jwt from 'jsonwebtoken'
import { Cookies } from 'quasar'

export default {
  name: 'u-page-users-steem-signup',
  preFetch ({ redirect, ssrContext }) {
    const cookies = process.env.SERVER ? Cookies.parseSSR(ssrContext) : Cookies
    const accessToken = jwt.decode(cookies.get('access_token'))
    let scopes = accessToken && accessToken.scopes ? accessToken.scopes : []

    if (!scopes.includes('createAccount')) {
      // redirect('/')
    }
  },

  // component methods.
  methods: {
    goToCreate () {
      this.$router.push('/signup/steem/username')
    },
    goToConnect () {
      this.$router.push('signup/steem/username')
    },
    skip () {
      if (typeof window !== 'undefined') window.location = this.$route.query.redirectUrl || process.env.UTOPIAN_DOMAIN
    }
  }
}
</script>

<template lang="pug" src="">
.create-user-form
  p.q-title You can connect a Steem account to receive SP rewards.
  q-btn.q-ma-sm.full-width(color="primary", label="Connect my Steem account", @click="goToConnect", :disabled="true")
  q-btn.q-ma-sm.full-width(color="primary", label="I don't have a Steem account", @click="goToCreate")
  p
    a(href="localhost:8080") Skip this step
</template>

<style lang="stylus">

.create-user-form {
  text-align center

  .q-if-addon-left {
    margin-top 5px
  }

  .q-field {
    height 75px
  }
}
</style>
