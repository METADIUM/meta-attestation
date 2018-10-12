import Web3 from 'web3';
/**
 * web3-config.json includes:
 *   - netid
 *   - url
 *   - addr
 *   - privkey
 *   - identity
 */
import web3config from './web3-config.json';
const privateKey = new Buffer(web3config.privkey, 'hex');

// Transaction.
const Tx = require('ethereumjs-tx');
const ethUtil = require('ethereumjs-util');

const web3 = new Web3(new Web3.providers.HttpProvider(web3config.url));

async function getTxData(to, data) {
  const txCount = await web3.eth.getTransactionCount(web3config.addr);
  // Construct the transaction data
  const txData = {
    nonce: web3.utils.toHex(txCount),
    gasLimit: web3.utils.toHex(40e3),
    gasPrice: web3.utils.toHex(10e9), // 10 Gwei
    from: web3config.addr,
    to: to,
    data: data,
    value: web3.utils.toHex(web3.utils.toWei('0.001', 'ether'))
  };
  return signTx(txData);
}

function sign(msg) {
  const hash = ethUtil.hashPersonalMessage(new Buffer(msg, 'hex'));
  return ethUtil.ecsign(hash, privateKey, web3.version.network);
}
  
function signTx(txData) {
  const transaction = new Tx(txData);
  transaction.sign(privateKey);
  return transaction.serialize();
}

// Signs the given transaction data and sends it. Abstracts some of the details 
// of buffering and serializing the transaction for web3.
function sendSigned(txData, cb) {
  web3.eth.sendSignedTransaction('0x' + signTx(txData).toString('hex'), cb);
}

async function sendTransaction(to, data) {
  const txData = await getTxData(to, data);
  sendSigned(txData, function(err, result) {
    if (err) return console.log('error', err);
    console.log('txid', result)
  });
}

export default web3;
export {
  getTxData,
  sign,
  signTx,
  sendSigned,
  sendTransaction
}