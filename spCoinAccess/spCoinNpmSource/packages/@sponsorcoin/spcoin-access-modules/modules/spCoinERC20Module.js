const { SpCoinLogger } = require("../utils/logging");
let spCoinLogger;

class SpCoinERC20Module {

  constructor(_spCoinContractDeployed) {
    this.spCoinContractDeployed = _spCoinContractDeployed;
    spCoinLogger = new SpCoinLogger(_spCoinContractDeployed)
  }

  signerTransfer = async ( _signer, _to, _value) => {
    await this.spCoinContractDeployed.transfer(_to, _value.toString());
  }

  transfer = async ( _to, _value) => {
    await this.spCoinContractDeployed.transfer(_to, _value.toString());
  }
}

//////////////////// MODULE EXPORTS //////////////////////

module.exports = {
  SpCoinERC20Module
}
