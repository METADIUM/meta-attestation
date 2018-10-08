let constants = {}
constants.organization = 'hexoul'
constants.repoName = 'poa-chain-spec'
constants.addressesSourceFile = 'contracts.json'
constants.ABIsSources = {
  ClaimManager: 'ClaimManager.abi.json'
}
constants.NEW_MINING_KEY = {
  label: 'New Mining Key',
  lastNameAndKey: '',
  fullName: '',
  value: '0x0000000000000000000000000000000000000000'
}
constants.minBallotDurationInDays = 2
constants.startTimeOffsetInMinutes = 5
constants.endTimeDefaultInMinutes = 2890
constants.getTransactionReceiptInterval = 5000
constants.NETID_TESTNET = '101'
module.exports = {
  constants
}