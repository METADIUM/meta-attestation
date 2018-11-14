import web3, { signABI } from '../web3';
import web3config from '../web3-config.json';
import { getBranch, getABI } from './helpers';

const eutil = require('ethereumjs-util');

export default class Identity {

  async init() {
    const branch = getBranch(web3config.netid);

    this.identityAbi = await getABI(branch, 'Identity');
    this.identityInstance = new web3.eth.Contract(this.identityAbi.abi, web3config.identity);
  }

  /**
   * @param {addr} string
   * @param {topic} uint256
   * @param {scheme} uint256 // 1: ECDSA_SCHEME, 2: RSA_SCHEME
   * @param {data} string
   * @param {uri} string
   * @param {signature} bytes
   */
  addClaim({ addr, topic, scheme, data, uri }) {
    // Validate ABI
    if (! this.identityInstance.methods.addClaim) return;

    const bData = Buffer.from(data);
    const bIssuer = Buffer.from(addr.substr(2), 'hex');
    const bTopic = eutil.setLengthLeft(topic, 32);

    const packed = Buffer.concat([bIssuer, bTopic, bData]);
    const packed32 = eutil.keccak256(packed);
    const claim = eutil.hashPersonalMessage(packed32);
    
    const { r, s, v } =  eutil.ecsign(claim, Buffer.from(web3config.privkey, 'hex'));
    const bV = new Buffer(1);
    bV[0] = v;
    const signature = Buffer.concat([r, s, bV]);

    return this.identityInstance.methods.addClaim(topic, scheme, web3config.addr, signature, bData, uri).encodeABI();

    // const claim = this.identityInstance.methods.claimToSign(web3config.addr, topic, bData).encodeABI();
    // const { r, s, v } = signABI(claim);
  }
}