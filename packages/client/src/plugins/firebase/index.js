import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'
import 'firebase/storage'
import 'firebase/functions'
import config from './config'
import configureFirestore from './firestore'
import configureStorage from './storage'
import configureFunctions from './functions'

export default ({ store, Vue }) => {
  const firebaseApp = firebase.initializeApp(config)

  Vue.prototype.firebase = firebaseApp
  window.firebase = firebaseApp

  configureFirestore(firebaseApp, Vue)
  configureStorage(firebaseApp, Vue)
  configureFunctions(firebaseApp)
}