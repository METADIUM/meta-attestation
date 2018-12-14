/**
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import 'babel-polyfill'

// React core.
import React from 'react'
import ReactDOM from 'react-dom'

// Styles
import styles from './app.css' // This uses CSS modules.
import './firebaseui-styling.global.css' // Import globally.

// Firebase.
import firebase from 'firebase/app'
import 'firebase/auth'
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth'

// Web3.
import web3, { sendTransaction } from './ethereum/web3'
import web3config from './ethereum/web3-config.json'

// Contracts.
import { contracts, initContracts } from 'meta-web3'

// Get the Firebase config from the auto generated file.
const firebaseConfig = require('./firebase-config.json').result

// Instantiate a Firebase app.
const firebaseApp = firebase.initializeApp(firebaseConfig)

const version = 'v1.1.3'
const topicNo = {
  github: 3,
  sms: 20,
  email: 30,
  subEmail: 31
}

/**
 * The Splash Page containing the login UI.
 */
class App extends React.Component {
  state = {
    isSignedIn: undefined,
    isPhoneAuth: false,
    contractReady: false
  };

  authPhoneConfig = {
    provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
    recaptchaParameters: {
      type: 'image', // 'audio' or 'image'
      size: 'normal', // 'normal' or 'invisible' or 'compact'
      badge: 'bottomleft' // ' bottomright' or 'inline' applies to invisible.
    }
    // defaultCountry: 'KR',
    // defaultNationalNumber: '821012341234',
    // loginHint: '+821023456789',
    // whitelistedCountries: ['US', '+82'],
    // blacklistedCountries: ['US', '+44'],
  };

  uiConfig = {
    signInFlow: 'popup',
    signInOptions: [
      // firebase.auth.GoogleAuthProvider.PROVIDER_ID,
      // firebase.auth.GithubAuthProvider.PROVIDER_ID,
      this.authPhoneConfig
    ],
    callbacks: {
      signInSuccessWithAuthResult: () => false
    }
  };

  actionCodeSettings = {
    // URL you want to redirect back to. The domain (www.example.com) for this URL
    // must be whitelisted in the Firebase Console.
    'url': window.location.href, // Here we redirect back to this same page.
    'handleCodeInApp': true // This must be true.
  };

  async attest (topic, data) {
    var addr = window.localStorage.getItem('reqAddr')
    if (!addr) return

    sendTransaction(addr, contracts.identity.addClaim({
      addr: addr,
      topic: topic,
      scheme: 1,
      data: data,
      uri: 'attestation'
    }).data, () => firebaseApp.auth().signOut())
  }

  // NOTE: URL encryption is needed to security?
  sendSignInLinkToEmail () {
    var email = document.getElementById('email')
    if (!email.value) return

    var addr = window.localStorage.getItem('reqAddr')
    if (!addr) return

    contracts.identity.filterClaimRequested(addr, (err, resp) => {
      if (!err) window.location.replace('aa://auth/' + resp.transactionHash)
    })

    firebase.auth().sendSignInLinkToEmail(email.value, this.actionCodeSettings)
  }

  isSignInWithEmailLink () {
    // Confirm the link is a sign-in with email link.
    if (!firebase.auth().isSignInWithEmailLink(window.location.href)) return

    var email = this.data
    if (!email) return

    // The client SDK will parse the code from the link for you.
    firebase.auth().signInWithEmailLink(email, window.location.href)
      .then(ret => {
        // You can access the new user via result.user
        // Additional user info profile not available via:
        // result.additionalUserInfo.profile == null
        // You can check if the user is new or existing:
        // result.additionalUserInfo.isNewUser
        this.setState({ isSignedIn: true })
      })
      .catch(err => {
        // Some error occurred, you can inspect the code: error.code
        // Common errors could be invalid email and invalid or expired OTPs.
        console.log(err)
      })
  }

  async initContracts () {
    initContracts({
      web3: web3,
      netid: web3config.netid,
      identity: web3config.identity,
      privkey: web3config.privkey
    }).then(async () => this.setState({ contractReady: true }))
  }

  constructor (props) {
    super(props)
    console.log(version)
    this.initContracts()
  }

  /**
   * @inheritDoc
   */
  componentWillMount () {
    // Store ether address to claim
    let url = window.location.href.split('/')
    let isEmailAuth = false; let isPhoneAuth = false; let existData = false
    for (let i in url) {
      if (url[i].startsWith('email')) {
        isEmailAuth = true
      } else if (url[i].startsWith('phone')) {
        isPhoneAuth = true
      } else if (url[i].startsWith('0x')) {
        let addrNdata = url[i].split('?')
        if (addrNdata.length === 1) break
        this.reqAddr = addrNdata[0]
        let data = addrNdata[1].split('=')
        if (data[0] !== 'data') break
        this.data = decodeURIComponent(data[1].split('&')[0])
        // this.authPhoneConfig.defaultNationalNumber = this.data;
        this.authPhoneConfig.loginHint = '+' + this.data
        existData = true
        window.localStorage.setItem('reqAddr', this.reqAddr)
      }
    }

    if (isEmailAuth && existData) this.setState({ isEmailAuth: true })
    else if (isPhoneAuth && existData) this.setState({ isPhoneAuth: true })
    else this.setState({ isEmailAuth: false, isPhoneAuth: false })

    // For manual phone sign-in
    /*
    window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('sign-in-button', {
      'size': 'invisible',
      'callback': function(response) {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
        onSignInSubmit();
      }
    });

    window.recaptchaVerifier.render().then(function(widgetId) {
      window.recaptchaWidgetId = widgetId;
    });
    */
  }

  /**
   * @inheritDoc
   */
  componentDidMount () {
    this.isSignInWithEmailLink()
    this.unregisterAuthObserver = firebaseApp.auth().onAuthStateChanged((user) => {
      this.setState({ isSignedIn: !!user })

      if (!user || !user.providerData) return

      // providerId: github.com || google.com || phone
      var topic, data
      switch (user.providerData[0].providerId) {
        // In case of github auth
        case 'github.com':
          topic = topicNo.github
          data = user.email
          break

        // In case of phone auth
        case 'phone':
          // if (this.reqPhoneNo && this.reqPhoneNo == user.phoneNumber) {
          topic = topicNo.sms
          data = user.phoneNumber
          /*
          } else {
            // Because of authentication with different phone number,
            // send fail response through URI
            window.replace('uri://authfail/' + user.phoneNumber)
          }
          */
          break

        // In case of email auth
        case 'google.com':
        default:
          if (window.location.href.includes('email2')) topic = topicNo.subEmail
          else topic = topicNo.email
          data = user.email
          break
      }

      if (topic && data) this.attest(topic, data)
    })
  }

  /**
   * @inheritDoc
   */
  componentWillUnmount () {
    this.unregisterAuthObserver()
  }

  /**
   * @inheritDoc
   */
  render () {
    return (
      <div className={styles.container}>
        <div className={styles.logo}>
          <center><img className={styles.logoIcon} /></center><br />
          <center>Verify your information and stack a claim</center>
        </div>
        <p />
        {this.state.isSignedIn !== undefined && !this.state.isSignedIn &&
          <div>
            {this.state.contractReady && !this.state.isEmailAuth && !this.state.isPhoneAuth &&
              <div>
                <h1 style={{ color: 'red' }}>Wrong request</h1>
              </div>
            }
            {this.state.contractReady && this.state.isEmailAuth &&
              <div>
                <input
                  className={styles.emailInput}
                  id='email'
                  type='text'
                  value={this.data}
                  placeholder='Put your email address'
                  disabled
                />
                <p />
                <center>
                  <button
                    className={styles.emailBtn}
                    type='button'
                    onClick={() => this.sendSignInLinkToEmail()}
                  >
                    <div className={styles.emailContent}><img className={styles.emailIcon} />Verify E-mail</div>
                  </button>
                  <p />
                  <div className={styles.emailAlert}>
                    If you have not received an email,<br />
                    please check your spam mailbox
                  </div>
                </center>
              </div>
            }
            {this.state.contractReady && this.state.isPhoneAuth &&
              <StyledFirebaseAuth
                className={styles.firebaseUi}
                uiConfig={this.uiConfig}
                firebaseAuth={firebaseApp.auth()}
              />
            }
          </div>
        }
        {this.state.isSignedIn &&
          <div className={styles.signedIn}>
            <center>
              Your {this.state.isEmailAuth ? 'E-mail' : 'Phone No.'} has been verified! Thanks!<br />
              <a className={styles.button} onClick={() => firebaseApp.auth().signOut()}>Sign-out</a>
            </center>
          </div>
        }
        <br /><br /><center>{version}</center>
      </div>
    )
  }
}

// Load the app in the browser.
ReactDOM.render(<App />, document.getElementById('app'))
