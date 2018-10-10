import web3 from '../web3';
import web3config from '../web3-config.json';
import helpers from './helpers';

export default class ClaimManager {
  async init({ netId }) {
    const branch = helpers.getBranch(netId);

    const claimManagerAbi = await helpers.getABI(branch, 'ClaimManager');
    this.claimManagerInstance = new web3.eth.Contract(claimManagerAbi, web3config.identity);
  }
}