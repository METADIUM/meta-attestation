import web3, { sign } from '../web3';
import web3config from '../web3-config.json';
import { getBranch, getABI } from './helpers';

export default class Identity {
  async init() {
    const branch = getBranch(web3config.netid);

    this.identityAbi = await getABI(branch, 'Identity');
    this.identityInstance = new web3.eth.Contract(this.identityAbi.abi, web3config.addr);
  }

  /**
   * @param {addr} string
   * @param {topic} uint256
   * @param {scheme} uint256
   * @param {data} bytes
   * @param {signature} bytes
   * @param {uri} string
   */
  addClaim({ addr, topic, scheme, uri }) {
    const data = 'data';
    const { r, s, v } = sign(data);
    const signature = Buffer.concat([new Buffer(r), new Buffer(s), new Buffer(v)]);
    return this.identityInstance.methods.addClaim(topic, scheme, web3config.addr, signature, new Buffer(data, 'hex'), uri).encodeABI();
  }
}