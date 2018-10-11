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

function sign(msg) {
  let hash = ethUtil.hashPersonalMessage(new Buffer(msg, 'hex'));
  return ethUtil.ecsign(hash, privateKey, web3.version.network);
}

// Signs the given transaction data and sends it. Abstracts some of the details 
// of buffering and serializing the transaction for web3.
function sendSigned(txData, cb) {
  const transaction = new Tx(txData);
  transaction.sign(privateKey);
  const serializedTx = transaction.serialize().toString('hex');
  web3.eth.sendSignedTransaction('0x' + serializedTx, cb);
}

function sendTransaction(to, data) {
  web3.eth.getTransactionCount(web3config.addr).then(txCount => {
    // Construct the transaction data
    const txData = {
      nonce: web3.utils.toHex(txCount),
      gasLimit: web3.utils.toHex(40e3),
      gasPrice: web3.utils.toHex(10e9), // 10 Gwei
      from: web3config.addr,
      to: to,
      data: data
      //value: web3.utils.toHex(web3.utils.toWei('0.01', 'ether'))
    } 

    // Fire away
    sendSigned(txData, function(err, result) {
      if (err) return console.log('error', err);
      console.log('sent', result)
    });
  });
}

export default web3;
export {
  sendSigned,
  sendTransaction,
  sign
}