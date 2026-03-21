"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpCoinRewardsModule = void 0;
const { bigIntToDateTimeString, bigIntToDecString, bigIntToHexString, bigIntToString, getLocation } = require("../utils//dateTime");
const { SpCoinLogger } = require("../utils/logging");
const { SpCoinSerialize } = require("../utils//serialize");
let spCoinLogger;
let spCoinSerialize;
class SpCoinRewardsModule {
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
exports.SpCoinRewardsModule = SpCoinRewardsModule;
