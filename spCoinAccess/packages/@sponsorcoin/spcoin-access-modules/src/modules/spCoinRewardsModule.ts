// @ts-nocheck
/**
 * SponsorCoin Access Modules
 * File: dist/modules/spCoinRewardsModule.js
 * Role: On-chain rewards and distribution-related operations.
 */
import { bigIntToDateTimeString, bigIntToDecString, bigIntToHexString, bigIntToString, getLocation } from "../utils//dateTime";
import { SpCoinLogger } from "../utils/logging";
import { SpCoinSerialize } from "../utils//serialize";
let spCoinLogger;
let spCoinSerialize;
export class SpCoinRewardsModule {
    constructor(_spCoinContractDeployed) {
        this.updateAccountStakingRewards = async (accountKey) => {
            spCoinLogger.logFunctionHeader("updateAccountStakingRewards(accountKey)");
            // console.log("=================================================================================================");
            // console.log("SpCoinRewardsModule:updateAccountStakingRewards");
            const tx = await this.spCoinContractDeployed.updateAccountStakingRewards(accountKey);
            // console.log("=================================================================================================");
            spCoinLogger.logExitFunction();
            return tx;
        };
        this.spCoinContractDeployed = _spCoinContractDeployed;
        spCoinLogger = new SpCoinLogger(_spCoinContractDeployed);
        spCoinSerialize = new SpCoinSerialize(_spCoinContractDeployed);
    }
}
