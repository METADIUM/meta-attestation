import Web3 from 'web3'
/**
 * web3-config.json includes:
 *   - netid
 *   - url
 *   - ws
 *   - addr
 *   - privkey
 *   - identity
 */
import web3config from './web3-config.json'
const privateKey = Buffer.from(web3config.privkey, 'hex')

// Transaction.
const Tx = require('ethereumjs-tx')
const eutil = require('ethereumjs-util')

const web3 = new Web3(new Web3.providers.HttpProvider(web3config.url))
// const web3ws = new Web3(new Web3.providers.WebsocketProvider(web3config.ws));
var web3ws

// Get TX data without nonce
function getTxDataWoNonce (to, data) {
  return {
    gasLimit: web3.utils.toHex(10e5),
    gasPrice: web3.utils.toHex(80e9), // 80 Gwei
    from: web3config.addr,
    to: to,
    data: data
    //, value: web3.utils.toHex(web3.utils.toWei('0.001', 'ether'))
  }
}

async function getTxData (to, data) {
  var txData = getTxDataWoNonce(to, data)
  txData['nonce'] = await web3.eth.getTransactionCount(web3config.addr)
  return txData
}

function sign (msg) {
  const hash = eutil.hashPersonalMessage(Buffer.from(msg, 'hex'))
  return eutil.ecsign(hash, privateKey /*, web3.version.network */)
}

function signABI (encodedABI) {
  const s = web3.utils.sha3(encodedABI).substr(2)
  const hash = eutil.hashPersonalMessage(Buffer.from(s, 'hex'))
  return eutil.ecsign(hash, privateKey)
}

function signTx (txData) {
  const transaction = new Tx(txData)
  transaction.sign(privateKey)
  return transaction.serialize()
}

// Signs the given transaction data and sends it. Abstracts some of the details
// of buffering and serializing the transaction for web3.
function sendSigned (txData, cb) {
  web3.eth.sendSignedTransaction('0x' + signTx(txData).toString('hex'), cb)
}

async function sendTransaction (to, data, cb) {
  const txData = await getTxData(to, data)
  sendSigned(signTx(txData), function (err, result) {
    if (err) return console.log('error', err)
    console.log('txid', result)

    // Callback
    cb()

    // Send success response through URI
    window.location.replace('aa://auth/' + result)
  })
}

export default web3
export {
  web3ws,
  getTxData,
  getTxDataWoNonce,
  sign,
  signABI,
  signTx,
  sendSigned,
  sendTransaction
}
