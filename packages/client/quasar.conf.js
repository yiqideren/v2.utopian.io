// environment config.
require('dotenv').config()
const path = require('path')

const I18N = require('@utopian/i18n/lib')
const ExtraWatchWebpackPlugin = require('extra-watch-webpack-plugin')

// quasar / app config.
module.exports = function (ctx) {
  // return config
  return {
    preFetch: true,
    supportIE: false,
    // list of animations to load.
    animations: [],
    // list of css files to load (including pre-processors).
    css: ['app.styl'],
    // quasar extras.
    extras: ['roboto-font', 'mdi', 'material-icons', 'fontawesome'],
    // quasar plugins.
    plugins: [
      'axios',
      { path: 'croppa', server: false },
      'i18n',
      { path: 'markdown', server: false },
      { path: 'sentry', server: false },
      { path: 'steem', server: false },
      'vuelidate'
    ],
    // build configuration.
    build: {
      env: {
        UTOPIAN_API: process.env.UTOPIAN_API,
        UTOPIAN_DOMAIN: process.env.UTOPIAN_DOMAIN,
        AUTH_DOMAIN: process.env.AUTH_DOMAIN,
        IPFS_ENDPOINT: process.env.IPFS_ENDPOINT,
        GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
        SENTRY_DSN: process.env.SENTRY_DSN,
        SEO_FB_ID: process.env.SEO_FB_ID,
        STEEM_API: process.env.STEEM_API || '"https://api.steemit.com"',
        STEEM_ADDRESS_PREFIX: process.env.STEEM_ADDRESS_PREFIX || '"STM"',
        ESCROW_ACCOUNT: process.env.ESCROW_ACCOUNT
      },
      scopeHoisting: true,
      vueRouterMode: 'history',
      useNotifier: false,
      chainWebpack(chain) {
        chain.module.rule('lint')
        .test(/\.(js|vue)$/)
        .pre()
        .use('eslint')
          .loader('babel-loader')
          .loader('eslint-loader')
          .options({
            rules: {
              semi: 'off',
              'eol-last': 0
            }
          })
        chain.module.rule('template-engine')
        .test(/\.pug$/)
        .include
          .add(path.resolve(__dirname, 'src'))
          .end()
        .use('pug')
          .loader('pug-plain-loader')
        chain.resolve.alias
        .set('~', __dirname)
        .set('@', path.resolve(__dirname, 'src'))
        // normalize the global => good for some non-isomorphic modules
        chain.output.set('globalObject', 'this')
        chain.plugin('i18n')
        .use(I18N, [
          [{
            debug: false
          }]
        ])
        chain.plugin('extraWatcher')
        .use(ExtraWatchWebpackPlugin, [
          {
            dirs: [`..${path.sep}i18n`]
          }
        ])
      }
      },
    // dev server configuration.
    devServer: {
      port: 8080,
      open: false // no auto browser.
    },
    // framework configuration.
    framework: {
      i18n: 'en-uk',
      iconSet: 'material-icons',
      components: [
        'QAjaxBar',
        'QAutocomplete',
        'QBreadcrumbs',
        'QBreadcrumbsEl',
        'QBtn',
        'QBtnDropdown',
        'QBtnGroup',
        'QBtnToggle',
        'QCard',
        'QCardActions',
        'QCardMain',
        'QCardMedia',
        'QCardSeparator',
        'QCardTitle',
        'QCarousel',
        'QCarouselControl',
        'QCarouselSlide',
        'QCheckbox',
        'QChip',
        'QChipsInput',
        'QCollapsible',
        'QDatetime',
        'QDatetimePicker',
        'QEditor',
        'QFab',
        'QFabAction',
        'QField',
        'QIcon',
        'QInfiniteScroll',
        'QInnerLoading',
        'QInput',
        'QItem',
        'QItemMain',
        'QItemSeparator',
        'QItemSide',
        'QItemTile',
        'QLayout',
        'QLayoutDrawer',
        'QLayoutFooter',
        'QLayoutHeader',
        'QList',
        'QListHeader',
        'QModal',
        'QModalLayout',
        'QNoSsr',
        'QOptionGroup',
        'QPage',
        'QPageContainer',
        'QPageSticky',
        'QParallax',
        'QPopover',
        'QProgress',
        'QPullToRefresh',
        'QRange',
        'QRouteTab',
        'QScrollArea',
        'QScrollObservable',
        'QSearch',
        'QSelect',
        'QSlideTransition',
        'QSlider',
        'QSpinner',
        'QSpinnerBars',
        'QSpinnerDots',
        'QStep',
        'QStepper',
        'QStepperNavigation',
        'QTab',
        'QTabPane',
        'QTabs',
        'QTimeline',
        'QTimelineEntry',
        'QToggle',
        'QToolbar',
        'QToolbarTitle',
        'QTooltip',
        'QUploader',
        'QVideo',
        'QTable',
        'QTh',
        'QTr',
        'QTd',
        'QTableColumns',
        'QWindowResizeObservable'
      ],
      directives: [
        'Ripple',
        'CloseOverlay',
        'BackToTop',
        'Platform'
      ],
      plugins: [
        'AddressbarColor',
        'Cookies',
        'Dialog',
        'Loading',
        'Meta',
        'Notify',
        'Screen'
      ]
    },

    // quasar modes.
    pwa: {
      manifest: {
        htmlLang: 'de',
        name: 'Utopian.io',
        short_name: 'Utopian.io',
        description: 'Earn rewards by contributing to your favorite Open Source projects!',
        start_url: '/',
        gcm_sender_id: '103953800507',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#4786ff',
        icons: [
          {
            'src': 'statics/icons/icon-128x128.png',
            'sizes': '128x128',
            'type': 'image/png'
          },
          {
            'src': 'statics/icons/icon-192x192.png',
            'sizes': '192x192',
            'type': 'image/png'
          },
          {
            'src': 'statics/icons/icon-256x256.png',
            'sizes': '256x256',
            'type': 'image/png'
          },
          {
            'src': 'statics/icons/icon-384x384.png',
            'sizes': '384x384',
            'type': 'image/png'
          },
          {
            'src': 'statics/icons/icon-512x512.png',
            'sizes': '512x512',
            'type': 'image/png'
          }
        ]
      }
    },
    ssr: {
      pwa: true
    },
    starterKit: '1.0.2'
  }
}
