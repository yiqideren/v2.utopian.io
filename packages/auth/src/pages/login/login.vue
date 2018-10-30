<script>
import { btoa } from 'b2a'

export default {
  preFetch ({ store, redirect }) {
    if (store.state.auth.user) {
      redirect('/')
    }
  },
  name: 'u-page-login',
  methods: {
    startGithubLogin () {
      const state = btoa(`githublogin::${this.$route.query.redirectUrl || process.env.UTOPIAN_DOMAIN}`)
      window.location = `https://github.com/login/oauth/authorize?scope=read:user,repo&client_id=${process.env.GITHUB_CLIENT_ID}&state=${state}`
    },
    startGoogleLogin () {
    },
    startLinkedinLogin () {
    }
  }
}
</script>

<template src="./login.pug" lang="pug"></template>

<style src="./login.styl" lang="stylus"></style>
