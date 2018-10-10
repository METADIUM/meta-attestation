import web3 from '../web3';
import web3config from '../web3-config.json';
import { getBranch, getABI } from './helpers';

export default class ClaimManager {
  constructor() {
  }

  async init() {
    const branch = getBranch(web3config.netid);

    const claimManagerAbi = await getABI(branch, 'ClaimManager');
    this.claimManagerInstance = new web3.eth.Contract(claimManagerAbi, web3config.identity);
  }
}