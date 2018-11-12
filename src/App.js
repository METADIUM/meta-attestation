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

import 'babel-polyfill';

// React core.
import React from 'react';
import ReactDOM from 'react-dom';

// Styles
import styles from './app.css'; // This uses CSS modules.
import './firebaseui-styling.global.css'; // Import globally.

// Firebase.
import firebase from 'firebase/app';
import 'firebase/auth';
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';

// Get the Firebase config from the auto generated file.
const firebaseConfig = require('./firebase-config.json').result;

// Instantiate a Firebase app.
const firebaseApp = firebase.initializeApp(firebaseConfig);

// Web3.
import web3, { sendTransaction } from './ethereum/web3';
import web3config from './ethereum/web3-config.json';

// Contracts.
import { getContractsAddresses } from './ethereum/contracts/addresses';
import Identity from './ethereum/contracts/Identity.contract';

/**
 * The Splash Page containing the login UI.
 */
class App extends React.Component {

  state = {
    isSignedIn: undefined,
    isPhoneAuth: false,
    contractReady: false,
  };

  contracts = {
    identity: new Identity()
  };

  authPhoneConfig = {
    provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
    recaptchaParameters: {
      type: 'image', // 'audio' or 'image'
      size: 'normal', // 'normal' or 'invisible' or 'compact'
      badge: 'bottomleft' //' bottomright' or 'inline' applies to invisible.
    },
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
      this.authPhoneConfig,
    ],
    callbacks: {
      signInSuccessWithAuthResult: () => false,
    },
  };

  actionCodeSettings = {
    // URL you want to redirect back to. The domain (www.example.com) for this URL
    // must be whitelisted in the Firebase Console.
    'url': window.location.href, // Here we redirect back to this same page.
    'handleCodeInApp': true // This must be true.
  };

  attest(topic, data) {
    var addr = window.localStorage.getItem('reqAddr');
    if (! addr) {
      return;
    }

    sendTransaction(addr, this.contracts.identity.addClaim({
      addr: addr,
      topic: topic,
      scheme: 1,
      data: data,
      uri: 'attestation'
    }));
  }

  // NOTE: URL encryption is needed to security?
  sendSignInLinkToEmail() {
    var email = document.getElementById('email');
    if (! email.value) {
      return;
    }

    firebase.auth().sendSignInLinkToEmail(email.value, this.actionCodeSettings)
      .then(function() {
        // The link was successfully sent. Inform the user.
        // Save the email locally so you don't need to ask the user for it again
        // if they open the link on the same device.
        window.localStorage.setItem('emailForSignIn', email.value);
      })
      .catch(function(error) {
        // Some error occurred, you can inspect the code: error.code
      });
  }

  isSignInWithEmailLink() {
    // Confirm the link is a sign-in with email link.
    if (! firebase.auth().isSignInWithEmailLink(window.location.href)) {
      return;
    }
    // Additional state parameters can also be passed via URL.
    // This can be used to continue the user's intended action before triggering
    // the sign-in operation.
    // Get the email if available. This should be available if the user completes
    // the flow on the same device where they started it.
    var email = window.localStorage.getItem('emailForSignIn');
    if (! email) {
      // User opened the link on a different device. To prevent session fixation
      // attacks, ask the user to provide the associated email again. For example:
      // email = window.prompt('Please provide your email for confirmation');
      return;
    }
    // The client SDK will parse the code from the link for you.
    firebase.auth().signInWithEmailLink(email, window.location.href)
      .then(function(result) {
        // Clear email from storage.
        window.localStorage.removeItem('emailForSignIn');
        // You can access the new user via result.user
        // Additional user info profile not available via:
        // result.additionalUserInfo.profile == null
        // You can check if the user is new or existing:
        // result.additionalUserInfo.isNewUser
        this.setState({ isSignedIn: true });
      })
      .catch(function(error) {
        // Some error occurred, you can inspect the code: error.code
        // Common errors could be invalid email and invalid or expired OTPs.
      });
  }

  async initContracts() {
    await getContractsAddresses(web3config.netid);
    Promise.all(Object.values(this.contracts).map(async (contract) => { await contract.init() }))
      .then(() => { this.setState({ contractReady: true }) });
  }

  constructor(props) {
    super(props);
    console.log('v1.0.1');
    this.isSignInWithEmailLink();
    this.initContracts();
  }

  /**
   * @inheritDoc
   */
  componentWillMount() {
    // Store ether address to claim
    let url = window.location.href.split('/');
    let isEmailAuth = false, isPhoneAuth = false, existData = false;
    for (let i in url) {
      if (url[i].startsWith('email')) {
        isEmailAuth = true;
      } else if (url[i].startsWith('phone')) {
        isPhoneAuth = true;
      } else if (url[i].startsWith('0x')) {
        let addrNdata = url[i].split('?');
        if (addrNdata.length === 1) break;
        this.reqAddr = addrNdata[0];
        let data = addrNdata[1].split('=');
        if (data[0] !== 'data') break;
        this.data = decodeURIComponent(data[1].split('&')[0]);
        // this.authPhoneConfig.defaultNationalNumber = this.data;
        this.authPhoneConfig.loginHint = '+' + this.data;
        existData = true;
        window.localStorage.setItem('reqAddr', this.reqAddr);
      }
    }

    if (isEmailAuth && existData) this.setState({ isEmailAuth: true });
    else if (isPhoneAuth && existData) this.setState({ isPhoneAuth: true });
    else this.setState({ isEmailAuth: false, isPhoneAuth: false });
    
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
  componentDidMount() {
    this.unregisterAuthObserver = firebaseApp.auth().onAuthStateChanged((user) => {
      this.setState({ isSignedIn: !!user });
      if (!user || !user.providerData) return;

      // console.log('user', user.providerData[0].providerId);
      // providerId: github.com || google.com || phone

      switch (user.providerData[0].providerId) {
        // In case of github auth
        case 'github.com':
          this.attest(3, user.email);
          break;

        // In case of phone auth
        case 'phone':
          if (true /* this.reqPhoneNo && this.reqPhoneNo == user.phoneNumber */) {
            this.attest(20, user.phoneNumber);
          } else {
            // Because of authentication with different phone number,
            // send fail response through URI
            window.open('uri://authfail/' + user.phoneNumber, '_blank');
          }
          break;

        // In case of email auth
        case 'google.com':
        default:
          this.attest(30, user.email);
          break;
      }
    });
  }

  /**
   * @inheritDoc
   */
  componentWillUnmount() {
    this.unregisterAuthObserver();
  }

  /**
   * @inheritDoc
   */
  render() {
    return (
      <div className={styles.container}>
        <div className={styles.logo}>
          <center><img className={styles.logoIcon} /></center><br />
          <center>Verify your information and stack a claim</center>
        </div>
        <p />
        {this.state.isSignedIn !== undefined && !this.state.isSignedIn &&
          <div>
            {this.state.contractReady && ! this.state.isEmailAuth && ! this.state.isPhoneAuth &&
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
                  disabled={true}
                />
                <p />
                <button
                  className={styles.emailBtn}
                  type='button'
                  onClick={() => this.sendSignInLinkToEmail()}
                >
                  <div className={styles.emailContent}><img className={styles.emailIcon} />Verify E-mail</div>
                </button>
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
      </div>
    );
  }
}

// Load the app in the browser.
ReactDOM.render(<App/>, document.getElementById('app'));
