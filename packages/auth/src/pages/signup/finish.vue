<script>
export default {
  name: 'u-page-signup-finish',
  methods: {
    goToApp () {
      window.location = 'http://localhost:8080'
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
  .u-goback-btn {
    width 100-x
  }
  .q-if-addon-left {
    margin-top 5px
  }

  .q-field {
    height 75px
  }
}
</style>
