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
import { getContractsAddresses } from './contracts/addresses';

const web3 = new Web3(new Web3.providers.HttpProvider(web3config.url));

getContractsAddresses(web3config.netid);

export default web3;