<script>
import jwt from 'jsonwebtoken'
import { Cookies } from 'quasar'

export default {
  name: 'u-page-users-steem-signup',
  preFetch ({ redirect, ssrContext }) {
    const cookies = process.env.SERVER ? Cookies.parseSSR(ssrContext) : Cookies
    const accessToken = jwt.decode(cookies.get('access_token'))
    let scopes = accessToken && accessToken.scopes ? accessToken.scopes : []

    if (!scopes.includes('user')) {
      redirect('/')
    }
  },

  methods: {
    goToCreate () {
      this.$router.push('/signup/steem/create')
    },
    goToConnect () {
      this.$router.push('signup/steem/username')
    },
    skip () {
      this.$router.push('/signup/finish')
    }
  }
}
</script>

<template lang="pug" src="">
.create-user-form
  p.q-title You're almost there! Just a few more steps and you'll be ready to use Utopian.io
  p.q-subtitle You can connect a Steem account to receive SP rewards
  .row
    q-btn.col-xs-12.col-md-3(color="primary", label="Connect", @click="goToConnect", :disabled="true")
    q-btn.q-ml-sm(flat, color="primary", label="I don't have a Steem account", @click="goToCreate")
  .row.justify-end.q-mt-sm
    q-btn.q-mt-md(outline, color="primary", label="Skip", @click="skip", icon-right="mdi-arrow-right")
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

  .u-next-btn {
    width 100%
    .q-btn {
      width 100px
    }
  }
}
</style>
