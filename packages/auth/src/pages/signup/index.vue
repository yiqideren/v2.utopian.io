<script>
import UtopianSignup from 'src/pages/signup/utopian/create'
import SteemSignup from 'src/pages/signup/steem'
import SteemSignupUsername from 'src/pages/signup/steem/username'
import SteemSignupPassword from 'src/pages/signup/steem/password'
import Finish from 'src/pages/signup/finish'

export default {
  name: 'u-page-signup',
  components: {
    UtopianSignup,
    SteemSignup,
    SteemSignupUsername,
    SteemSignupPassword,
    Finish
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
q-layout.u-page-signup.column.items-center
  img.utopian-logo(src="~assets/img/logo-black.svg")
  .centered-container
    q-stepper.main-stepper(
      v-model="currentStep",
      active-icon="mdi-pencil",
      done-icon="mdi-check",
      error-icon="mdi-alert-circle",
      alternative-labels,
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

      q-step(name="finish" title="Finish" subtitle="Go to app")
        q-stepper-navigation
          finish
</template>

<style lang="stylus">
.u-page-signup {
  background-color #f7f7f7
  .utopian-logo {
    margin-top 50px
    height 60px
    margin-bottom 50px
  }
  .centered-container {
    width 600px
    .q-stepper.main-stepper {
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
      width 100%
      text-align center
      .utopian-logo {
        height 60px
        margin-bottom 20px
      }
    }
  }
}
</style>
