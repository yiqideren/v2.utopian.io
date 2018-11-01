<script>
import { mapActions } from 'vuex'
import authPlugin from 'src/plugins/auth'

export default {
  name: 'u-app',
  async preFetch ({ currentRoute, store, redirect, ssrContext }) {
    await authPlugin({ currentRoute, store, redirect, ssrContext })
    store.commit('utils/setRedirectUrl', currentRoute.query.redirectUrl)
  },
  methods: {
    ...mapActions('utils', ['transferToLocalStorage'])
  },
  mounted () {
    this.transferToLocalStorage()

    if (this.$route.path === '/') {
      if (this.$route.query.redirectUrl) {
        if (typeof window !== 'undefined') window.location = this.$route.query.redirectUrl || process.env.UTOPIAN_DOMAIN
      } else {
        this.$router.push('login')
      }
    }
  }
}
</script>

<!-- import component template. -->
<template lang="pug">
  // wrapper element.
  div.u-app#q-app
    // router view enabler.
    router-view
</template>
