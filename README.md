# Meta attestation

> Attestation sample based on ERC725 and ERC735

## Web3

Before compiling, `web3-config.json` should be provided following spec described in `web3.js`.
Here is example:
```
{
  "netid": "ropsten",
  "url": "https://ropsten.infura.io",
  "addr": "0xA408FCD6B7f3847686Cb5f41e52A7f4E084FD3cc",
  "privkey": "11111111111111111111111111111111111111111111",
  "identity": "0x7304f14b0909640acc4f6a192381091eb1f37701"
}
```

## Initial setup, building and serving.

1. Create a Firebase project using the [Firebase console](https://console.firebase.google.com).
1. In the **Authentication** section of your project's Firebase console, open the **Sign-In Method** tab and enable the **Google** and the **Email/Password** sign-in providers.
1. Install the run-time and build dependencies:
    ```bash
    npm install
    ```
1. Tell Firebase to use your new project locally:
    ```bash
    firebase use --add
    ```
1. Run the build script to transpile and pack the sources:
    ```bash
    npm run build
    ```
1. Serve the app locally:
    ```bash
    npm run serve
    ```
1. Try out the app by opening [http://localhost:5000](http://localhost:5000) in your browser.


## License

© Google, 2011. Licensed under an [Apache-2](../LICENSE) license.
