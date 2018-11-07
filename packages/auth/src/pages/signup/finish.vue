<script>
import { Cookies } from 'quasar'

export default {
  name: 'u-page-signup-finish',
  preFetch ({ redirect, ssrContext }) {
    const cookies = process.env.SERVER ? Cookies.parseSSR(ssrContext) : Cookies

    this.redirectUrl = cookies.get('redirect_url')
  },
  data () {
    return {
      redirectUrl: process.env.UTOPIAN_DOMAIN
    }
  },
  methods: {
    goToApp () {
      if (typeof window !== 'undefined') window.location = this.redirectUrl || process.env.UTOPIAN_DOMAIN
    }
  }
}
</script>

<template lang="pug">
  div.create-user-form
    p.q-title You're all set!
    p.q-subtitle Now you can start using Utopian.io
    q-card.bg-white
      q-card-main
        .column.justify-center
          q-icon.q-ma-lg(name="mdi-account-check", color="positive", size="15em")
        q-card-separator
        .row.justify-end.u-goback-btn
          q-btn.q-mt-lg(color="primary", icon-right="mdi-arrow-right", label="Go back to the app", @click="goToApp")
</template>

<style lang="stylus">
.create-user-form {
  .q-if-addon-left {
    margin-top 5px
  }

  .q-field {
    height 75px
  }
}
</style>
