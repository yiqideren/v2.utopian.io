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
    p.q-title You're all set1!
    q-btn.full-width(color="primary", label="Go back to the app", @click="goToApp")
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
