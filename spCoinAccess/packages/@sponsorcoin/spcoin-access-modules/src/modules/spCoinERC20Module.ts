// @ts-nocheck
// File: /@sponsorcoin/spcoin-access-modules/modules/spCoinERC20Module.js
const { SpCoinLogger } = require("../utils/logging");
let spCoinLogger;
export class SpCoinERC20Module {
    spCoinContractDeployed: any;
    signerTransfer: (_signer: any, _to: string, _value: string | number | bigint) => Promise<void>;
    transfer: (_to: string, _value: string | number | bigint) => Promise<void>;

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


