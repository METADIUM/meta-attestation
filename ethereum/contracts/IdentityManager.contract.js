import web3 from '../web3';
import { getAddresses } from './addresses';
import helpers from './helpers';

export default class IdentityManager {
  async init({ netId }) {
    const { IDENTITY_MANAGER_ADDRESS } = getAddresses(netId);
    console.log('Identity Manager address', IDENTITY_MANAGER_ADDRESS);
    const branch = helpers.getBranch(netId);

    const identityManagerAbi = await helpers.getABI(branch, 'IdentityManager');
    this.identityManagerInstance = new web3.eth.Contract(identityManagerAbi, IDENTITY_MANAGER_ADDRESS);
  }
}