// @ts-nocheck
/**
 * SponsorCoin Access Modules
 * File: dist/modules/spCoinERC20Module.js
 * Role: ERC20-compatible token operations exposed through the SponsorCoin access layer.
 */
// @ts-nocheck
// File: /@sponsorcoin/spcoin-access-modules/modules/spCoinERC20Module.js
import { SpCoinLogger } from "../utils/logging";
let spCoinLogger;
export class SpCoinERC20Module {
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
