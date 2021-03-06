import { createLocalVue, shallowMount } from '@vue/test-utils'

import Vuex from 'vuex'
import VueRouter from 'vue-router'
import Quasar, { Cookies } from 'quasar'

require('babel-core').transform('code', {
  plugins: ['dynamic-import-node']
})

const mockSsrContext = () => {
  return {
    req: {
      headers: {}
    },
    res: {
      setHeader: () => undefined
    }
  }
}

const localVue = createLocalVue()
localVue.use(Vuex)
localVue.use(VueRouter)
localVue.use(Quasar)

// https://eddyerburgh.me/mock-vuex-in-vue-unit-tests
export const mountQuasar = (component, options = {}) => {
  const app= {}
  const store = new Vuex.Store({})
  const router = new VueRouter()

  if (options) {
    const ssrContext = options.ssr ? mockSsrContext() : null

    if (options.cookies) {
      const cookieStorage = ssrContext ? Cookies.parseSSR(ssrContext) : Cookies
      const cookies = options.cookies
      Object.keys(cookies).forEach(key => {
        cookieStorage.set(key, cookies[key])
      })
    }

    if (options.plugins) {
      options.plugins.forEach(plugin => {
        plugin({ app, store, router, Vue: localVue, ssrContext })
      })
    }
  }

  // mock the i18n
  const $t = () => {}
  const $tc = () => {}
  const $n = () => {}
  const $d = () => {}

  return shallowMount(component, {
    localVue: localVue,
    store,
    router,
    mocks:{ $t, $tc, $n, $d },
    // Injections for Components with a QPage root Element
    // todo: make this Utopian v2 compliant
    provide: {
      pageContainer: true,
      layout: {
        header: {},
        right: {},
        footer: {},
        left: {}
      }
    }
  })
}
