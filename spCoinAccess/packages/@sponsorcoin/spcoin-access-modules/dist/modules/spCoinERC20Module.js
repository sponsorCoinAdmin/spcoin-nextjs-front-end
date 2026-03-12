// @ts-nocheck
// File: /@sponsorcoin/spcoin-access-modules/modules/spCoinERC20Module.js
const { SpCoinLogger } = require("../utils/logging");
let spCoinLogger;
class SpCoinERC20Module {
    constructor(_spCoinContractDeployed) {
        this.signerTransfer = async (_signer, _to, _value) => {
            await this.spCoinContractDeployed.transfer(_to, _value.toString());
        };
        this.transfer = async (_to, _value) => {
            await this.spCoinContractDeployed.transfer(_to, _value.toString());
        };
        this.spCoinContractDeployed = _spCoinContractDeployed;
        spCoinLogger = new SpCoinLogger(_spCoinContractDeployed);
    }
}
//////////////////// MODULE EXPORTS //////////////////////
module.exports = {
    SpCoinERC20Module
};
