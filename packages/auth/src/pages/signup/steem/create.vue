<script>
import { required, minLength, maxLength, helpers } from 'vuelidate/lib/validators'
import { mapGetters, mapActions } from 'vuex'
import jwt from 'jsonwebtoken'
import { Cookies, debounce, Notify, Loading } from 'quasar'

export default {
  name: 'u-page-signup-steem-create',
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
      ...mapGetters('users', {
        getUtopianUsername: 'username'
      }),
      currentStep: 'utopian',
      // user internal data.
      user: {
        username: '',
        usernameAvailable: '',
        password: '',
        keys: {
          ownerKey: '',
          activeKey: '',
          postingKey: '',
          memoKey: ''
        }
      }
    }
  },

  // component validations.
  validations: {
    user: {
      username: {
        required,
        minLength: minLength(3),
        maxLength: maxLength(32),
        usernameAvailable: (value, vm) => vm.usernameAvailable,
        regex: helpers.regex('alpha', /^[A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)*$/)
      },
      password: {
        required,
        minLength: minLength(12)
      }
    }
  },

  // component methods.
  methods: {
    ...mapActions('blockchainSteem', [
      'isSteemUsernameAvailable',
      'createSteemAccount',
      'generatePassword',
      'generatePrivateKeysFromPassword',
      'generateAuthFromKeys'
    ]),
    validateUsername () {
      this.user.usernameAvailable = 'checking'
      this.checkUsername()
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
    checkUsername: debounce(async function () {
      const usernameValidator = this.$v.user.username
      this.$v.user.$touch()
      if (this.user.username.length > 2 && usernameValidator.minLength &&
        usernameValidator.maxLength && usernameValidator.regex) {
        this.user.usernameAvailable = await this.isSteemUsernameAvailable(this.user.username)
      }
      if (this.user.usernameAvailable === 'checking') {
        this.user.usernameAvailable = ''
      }
    }, 1000),
    getErrorLabel () {
      const usernameValidator = this.$v.user.username

      if (!usernameValidator.minLength) {
        return 'The username should be at least 3 characters long.'
      } else if (!usernameValidator.maxLength) {
        return 'The username should have the maximum of 32 characters.'
      } else if (!usernameValidator.regex) {
        return 'Please use alphanumeric characters. Dot, underscore and dash are allowed as separators.'
      } else if (!usernameValidator.usernameAvailable) {
        return 'Sorry. This username is not available.'
      }

      return ''
    },
    async submit () {
      this.$v.user.$touch()

      Loading.show({ message: this.$t('users.create.loading') })
      try {
        const keys = await this.generatePrivateKeysFromPassword({ username: this.user.username, password: this.user.password })
        const auth = await this.generateAuthFromKeys(keys)

        const res = await this.createSteemAccount({
          username: this.user.username,
          ownerAuth: auth.ownerAuth,
          activeAuth: auth.activeAuth,
          postingAuth: auth.postingAuth,
          memoAuth: auth.memoAuth
        })

        if (res.error) throw new Error({ message: res.error })

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

  async mounted () {
    this.user.password = await this.generatePassword()
    this.user.username = this.getUtopianUsername()
    if (this.user.username !== '') {
      this.validateUsername()
      setTimeout(() => {
        this.$refs.username.$el.focus()
      }, 1000)
    }
  }
}
</script>

<template lang="pug">
div.create-user-form
  p.q-title You're almost there! Just a few more steps and you'll be ready to use Utopian.io
  p.q-subtitle Create a Steem account
  q-stepper(
    v-model="currentStep",
    active-icon="mdi-pencil",
    done-icon="mdi-check",
    error-icon="mdi-alert-circle",
    alternative-labels,
    vertical
  )
    q-step(name="username" title="Username" icon="mdi-account")
      q-stepper-navigation
        p.q-subtitle Create a unique username for Steem. We recommend you to use the same username you created for Utopian, if possible.
        q-field.full-width.q-mb-md(
          :error="$v.user.username.$error && user.usernameAvailable !== 'checking'",
          :error-label="getErrorLabel()"
        )
          q-input(
            v-model.trim="user.username",
            ref="username"
            placeholder="ada.lovelace",
            :before="[{ icon: 'mdi-account' }]",
            prefix="@"
            maxlength="32"
            @input="validateUsername()"
            :loading="user.usernameAvailable === 'checking'"
            :color="user.usernameAvailable === true ? 'green' : 'primary'"
          )
        .row.justify-end.u-next-btn
          q-btn(color="primary", icon-right="mdi-arrow-down", label="Next", @click="currentStep = 'password'", :disabled="user.usernameAvailable !== true")

    q-step(name="password" title="Password" icon="mdi-key")
      q-stepper-navigation
        p.q-subtitle We have generated a secure password for you. Make sure to save it at a safe and secure location as
          b  IT CANNOT BE RESTORED OR RECOVERED.
        q-field.full-width.q-mb-md(
          :error="$v.user.password.$error",
          :error-label="getErrorLabel()"
        )
          q-input(
            v-model.trim="user.password",
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
  .q-stepper {
    background-color white
  }
  .q-if-addon-left {
    margin-top 5px
  }

  .q-field {
    height 75px
  }
}
</style>
