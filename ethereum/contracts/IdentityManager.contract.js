import web3 from '../web3';
import web3config from '../web3-config.json';
import { getAddresses } from './addresses';
import helpers from './helpers';

export default class IdentityManager {
  async init({ netId }) {
    if (netId == undefined || netId == '') netId = web3config.netid;
    const { IDENTITY_MANAGER_ADDRESS } = getAddresses(netId);
    console.log('Identity Manager address', IDENTITY_MANAGER_ADDRESS);
    const branch = helpers.getBranch(netId);

    const identityManagerAbi = await helpers.getABI(branch, 'IdentityManager');
    this.identityManagerInstance = new web3.eth.Contract(identityManagerAbi, IDENTITY_MANAGER_ADDRESS);
  }
}