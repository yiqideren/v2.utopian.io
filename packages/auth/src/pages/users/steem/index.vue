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
      this.$router.push({ name: 'users.steem.create', query: { redirectUrl: this.$route.query.redirectUrl } })
    },
    goToConnect () {
      this.$router.push({ name: 'users.steem.connect', query: { redirectUrl: this.$route.query.redirectUrl } })
    },
    skip () {
      if (typeof window !== 'undefined') window.location = this.$route.query.redirectUrl || process.env.UTOPIAN_DOMAIN
    }
  }
}
</script>

<template lang="pug" src="">
q-layout.u-page-users-create
  div.row.justify-center.items-center
    div.create-user-form
      img.utopian-logo(src="~assets/img/logo-black.svg")
      p.q-title You can connect a Steem account to receive SP rewards.
      q-btn.q-ma-sm.full-width(color="primary", label="Connect my Steem account", @click="goToConnect", :disabled="true")
      q-btn.q-ma-sm.full-width(color="primary", label="I don't have a Steem account", @click="goToCreate")
      p
        a(href="localhost:8080") Skip this step
</template>

<style lang="stylus">
.u-page-users-create {
  > div {
    height 100vh
  }
  .create-user-form {
    text-align center
    .utopian-logo {
      height 60px
      margin-bottom 20px
    }
  }

  .q-if-addon-left {
    margin-top 5px
  }

  .q-field {
    height 75px
  }
}
</style>
