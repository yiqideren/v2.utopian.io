<script>
import { required, minLength } from 'vuelidate/lib/validators'
import { mapGetters, mapActions } from 'vuex'
import jwt from 'jsonwebtoken'
import * as randomBytes from 'randombytes'
// import * as dsteem from 'dsteem'
import { Cookies, Notify, Loading } from 'quasar'

// const dsteemClient = new dsteem.Client()

export default {
  name: 'u-page-signup-steem-password',
  preFetch ({ redirect, ssrContext }) {
    const cookies = process.env.SERVER ? Cookies.parseSSR(ssrContext) : Cookies
    const accessToken = jwt.decode(cookies.get('access_token'))
    let scopes = accessToken && accessToken.scopes ? accessToken.scopes : []

    if (!scopes.includes('createAccount')) {
      // redirect('/')
    }
  },

  // component data.
  data () {
    return {
      // map user store getters.
      ...mapGetters('auth', [
        'account',
        'username'
      ]),

      // user internal data.
      user: {
        password: ''
      }
    }
  },

  // component validations.
  validations: {
    ...mapGetters('api', ['getTokens']),
    user: {
      password: {
        required,
        minLength: minLength(12)
      }
    }
  },

  // component methods.
  methods: {
    ...mapActions('blockchainSteem', [
      'isSteemUsernameAvailable'
    ]),
    validateUsername () {
      this.user.usernameAvailable = 'checking'
      this.checkUsername()
    },
    generatePassword () {
      this.user.password = randomBytes(32).toString('hex')
    },
    downloadPassword () {
      const element = document.createElement('a')
      const info = 'Please make sure that you save this password and deconste the file afterwards.' +
        ' We advise writing it down on several pieces of papers and storing it in a secure place' +
        ' and/or using a password-safe application.'
      const password = `\r\n\r\nPassword: ${this.user.password}`
      element.setAttribute(
        'href',
        'data:text/plaincharset=utf-8,' + encodeURIComponent(info + password)
      )
      element.setAttribute('download', Date.now())
      element.style.display = 'none'
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    },
    getErrorLabel () {
      const usernameValidator = this.$v.user.password

      if (!usernameValidator.minLength) {
        return 'The username should be at least 12 characters long.'
      }

      return ''
    },
    async submit () {
      this.$v.user.$touch()

      Loading.show({ message: this.$t('users.create.loading') })
      try {
        await this.saveUser({ username: this.user.username })
        Loading.hide()

        this.$router.push('/signup/finish')
      } catch (err) {
        Loading.hide()
        Notify.create({
          type: 'negative',
          position: 'bottom-right',
          message: this.$t(`api.error.${err.message}`)
        })
      }
    }
  },

  mounted () {
    this.generatePassword()
  }
}
</script>

<template lang="pug">
div.create-user-form
  p.q-title This is your Steem password key.
  p.q-subtitle Make sure to save your password at a safe and secure location as IT CANNOT BE RESTORED OR RECOVERED.
  q-field.full-width.q-mb-md(
    :error="$v.user.password.$error",
    :error-label="getErrorLabel()"
  )
    q-input(
      v-model.trim="user.password",
      placeholder="ada.lovelace",
      :before="[{ icon: 'mdi-key' }]",
      :after="[{ icon: 'mdi-download', handler() { downloadPassword() } }]",
      @input="$v.user.$touch()",

    )
  q-btn.full-width(
    color="primary",
    label="Create",
    @click="submit"
  )
</template>

<style lang="stylus">
.create-user-form {
  max-width 485px
  .q-if-addon-left {
    margin-top 5px
  }

  .q-field {
    height 75px
  }
}
</style>
