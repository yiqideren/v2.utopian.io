<script>
import UtopianSignup from 'src/pages/signup/utopian/create'
import SteemSignup from 'src/pages/signup/steem'
import SteemSignupUsername from 'src/pages/signup/steem/username'
import SteemSignupPassword from 'src/pages/signup/steem/password'

export default {
  name: 'u-page-signup',
  components: {
    UtopianSignup,
    SteemSignup,
    SteemSignupUsername,
    SteemSignupPassword
  },
  mounted () {
    this.currentStep = this.$route.params.step
  },
  data () {
    return {
      currentStep: 'utopian'
    }
  },
  watch: {
    '$route' (to, from) {
      this.currentStep = to.params.step
    }
  }
}
</script>

<template lang="pug">
q-layout.u-page-signup.column.items-center.justify-center
  img.utopian-logo(src="~assets/img/logo-black.svg")
  q-stepper(
    v-model="currentStep",
    active-icon="mdi-pencil",
    done-icon="mdi-check",
    error-icon="mdi-alert-circle",
    no-header-navigation
  )
    q-step(name="utopian" title="Utopian" subtitle="Create username")
      q-stepper-navigation
        utopian-signup

    q-step(name="steem" title="Steem" subtitle="Connect account")
      q-stepper-navigation
        steem-signup

    q-step(name="steem/username" title="Steem" subtitle="Create username")
      q-stepper-navigation
        steem-signup-username

    q-step(name="steem/password" title="Steem" subtitle="Create password")
      q-stepper-navigation
        steem-signup-password

    q-step(name="finish" title="Finish" subtitle="Go to app")
      q-stepper-navigation
        q-btn(
          color="primary"
          @click="currentStep = 'first'"
          label="Go Back"
        )
</template>

<style lang="stylus">
.u-page-signup {
  .utopian-logo {
    height 60px
    margin-bottom 20px
  }
  .q-stepper {
    border none !important
    box-shadow none
    .q-stepper-header {
      border none
      box-shadow none
    }
    .q-stepper-nav {
      justify-content center
    }
  }

  .create-user-form {
    text-align center
    .utopian-logo {
      height 60px
      margin-bottom 20px
    }
  }
}
</style>
