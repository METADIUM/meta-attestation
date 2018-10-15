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
import logo from '../public/images/logo.png';

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
  uiConfig = {
    signInFlow: 'popup',
    signInOptions: [
      firebase.auth.GoogleAuthProvider.PROVIDER_ID,
      firebase.auth.GithubAuthProvider.PROVIDER_ID,
      firebase.auth.PhoneAuthProvider.PROVIDER_ID,
    ],
    callbacks: {
      signInSuccessWithAuthResult: () => false,
    },
  };

  state = {
    isSignedIn: undefined,
  };

  actionCodeSettings = {
    // URL you want to redirect back to. The domain (www.example.com) for this URL
    // must be whitelisted in the Firebase Console.
    'url': window.location.href, // Here we redirect back to this same page.
    'handleCodeInApp': true // This must be true.
  };

  test() {
    sendTransaction(web3config.identity, '');
  }

  attest(topic) {
    var addr = window.localStorage.getItem('reqAddr');
    if (! addr) {
      return;
    }

    sendTransaction(addr, this.identity.addClaim({
      addr: addr,
      topic: topic,
      scheme: 1,
      uri: 'attestation'
    }));
  }

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
        this.setState({isSignedIn: true});
      })
      .catch(function(error) {
        // Some error occurred, you can inspect the code: error.code
        // Common errors could be invalid email and invalid or expired OTPs.
      });
  }

  async initContracts() {
    await getContractsAddresses(web3config.netid);
    this.identity = new Identity();
    await this.identity.init();
  }

  constructor(props) {
    super(props);
    this.isSignInWithEmailLink();
    this.initContracts();
  }

  /**
   * @inheritDoc
   */
  componentWillMount() {
    // Store ether address to claim
    let url = window.location.href.split("/");
    if (url[url.length-1].startsWith('0x')) {
      this.reqAddr = url[url.length-1].split("&")[0];
      window.localStorage.setItem('reqAddr', this.reqAddr);
    }

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
      this.setState({isSignedIn: !!user});
      if (user) {
        console.log('user', user.providerData[0].providerId);
        // providerId: github.com || google.com || phone
        /*
        switch (user.providerData[0].providerId) {
          case 'google.com': this.attest(1); break;
          case 'github.com': this.attest(2); break;
          case 'phone': this.attest(3); break;
          default: this.attest(1); break;
        }
        */
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
          {/* <i className={styles.logoIcon + ' material-icons'}>photo</i> Meta Attestation */}
          <center><img className={styles.logoIcon} src={logo}/></center>
        </div>
        {this.state.isSignedIn !== undefined && !this.state.isSignedIn &&
          <div>
            <StyledFirebaseAuth
              className={styles.firebaseUi}
              uiConfig={this.uiConfig}
              firebaseAuth={firebaseApp.auth()}
            />
            <center>
              <input type="text" id="email" placeholder="Put your email" />
              <button type="button" onClick={() => this.sendSignInLinkToEmail()}>Sign in with Email link</button>
            </center>
            <p />
            <center>
              <button type="button" onClick={() => this.test()}>TEST</button>
            </center>
          </div>
        }
        {this.state.isSignedIn &&
          <div className={styles.signedIn}>
            <center>
              Hello !! {firebaseApp.auth().currentUser.displayName}<br />
              You are now signed in!<br />
              using {firebaseApp.auth().currentUser.providerData[0].providerId}<br />
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
