import web3 from '../web3';
import web3config from '../web3-config.json';
import { getBranch, getABI } from './helpers';

export default class Identity {
  async init() {
    const branch = getBranch(web3config.netid);

    const identityAbi = await getABI(branch, 'Identity');
    this.identityInstance = new web3.eth.Contract(identityAbi.abi, web3config.identity);
  }
}