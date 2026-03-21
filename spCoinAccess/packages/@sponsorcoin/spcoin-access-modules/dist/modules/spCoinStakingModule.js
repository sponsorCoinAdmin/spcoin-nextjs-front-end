"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.millennium = exports.month = exports.year = exports.week = exports.day = exports.hour = exports.minute = exports.second = exports.bigIntToDecString = exports.SpCoinStakingModule = void 0;
const { bigIntToDecString, second, minute, hour, day, week, year, month, millennium } = require("../utils//dateTime");
exports.bigIntToDecString = bigIntToDecString;
exports.second = second;
exports.minute = minute;
exports.hour = hour;
exports.day = day;
exports.week = week;
exports.year = year;
exports.month = month;
exports.millennium = millennium;
const { SpCoinLogger } = require("../utils/logging");
let spCoinLogger;
const SPONSOR = 0;
const RECIPIENT = 1;
const AGENT = 2;
const burnAddress = "0x0000000000000000000000000000000000000000";
class SpCoinStakingModule {
    constructor(_spCoinContractDeployed) {
        this.testStakingRewards = async (lastUpdateTime, testUpdateTime, interestRate, quantity) => {
            // spCoinLogger.logFunctionHeader("getStakingRewards(lastUpdateTime,  interestRate,  quantity)");
            let stakingRewards = await this.spCoinContractDeployed.testStakingRewards(lastUpdateTime, testUpdateTime, interestRate, quantity);
            spCoinLogger.logExitFunction();
            return stakingRewards;
        };
        this.getStakingRewards = async (lastUpdateTime, interestRate, quantity) => {
            // spCoinLogger.logFunctionHeader("getStakingRewards(lastUpdateTime,  interestRate,  quantity)");
            let stakingRewards = await this.spCoinContractDeployed.getStakingRewards(lastUpdateTime, interestRate, quantity);
            spCoinLogger.logExitFunction();
            return stakingRewards;
        };
        this.getTimeMultiplier = async (_timeRateMultiplier) => {
            // spCoinLogger.getTimeMultiplier("getTimeMultiplier(_timeRateMultiplier)");
            let timeRateMultiplier = await this.spCoinContractDeployed.getTimeMultiplier(_timeRateMultiplier);
            spCoinLogger.logExitFunction();
            return timeRateMultiplier;
        };
        this.getAccountTimeInSecondeSinceUpdate = async (_tokenLastUpdate) => {
            let timeInSecondeSinceUpdate = await this.spCoinContractDeployed.getAccountTimeInSecondeSinceUpdate(_tokenLastUpdate);
            spCoinLogger.logExitFunction();
            return timeInSecondeSinceUpdate;
        };
        this.getMillenniumTimeIntervalDivisor = async (_timeInSeconds) => {
            // console.log("getMillenniumTimeIntervalDivisor("+ _timeInSeconds + ")"); 
            let annualizedPercentage = await spCoinContractDeployed.connect(this.signer).getMillenniumTimeIntervalDivisor(_timeInSeconds);
            // return annualizedPercentage;
            return bigIntToDecString(annualizedPercentage);
        };
        this.depositSponsorStakingRewards = async (_sponsorAccount, _recipientAccount, _recipientRate, _amount) => {
            spCoinLogger.logFunctionHeader("depositSponsorStakingRewards = async(" +
                _sponsorAccount + ", " +
                _recipientAccount + ", " +
                _recipientRate + ", " +
                _amount + ")");
            const tx = await this.spCoinContractDeployed.depositStakingRewards(SPONSOR, _sponsorAccount, _recipientAccount, _recipientRate, _sponsorAccount, 0, _amount);
            spCoinLogger.logExitFunction();
            return tx;
        };
        this.depositRecipientStakingRewards = async (_sponsorAccount, _recipientAccount, _recipientRate, _amount) => {
            spCoinLogger.logFunctionHeader("depositRecipientStakingRewards = async(" +
                _sponsorAccount + ", " +
                _recipientAccount + ", " +
                _recipientRate + ", " +
                _amount + ")");
            const tx = await this.spCoinContractDeployed.depositStakingRewards(RECIPIENT, _sponsorAccount, _recipientAccount, _recipientRate, burnAddress, 0, _amount);
            spCoinLogger.logExitFunction();
            return tx;
        };
        this.depositAgentStakingRewards = async (_sponsorAccount, _recipientAccount, _recipientRate, _agentAccount, _agentRate, _amount) => {
            spCoinLogger.logFunctionHeader("depositAgentStakingRewards = async(" +
                _recipientAccount, _agentAccount + ", " +
                _agentRate + ", " +
                _amount + ")");
            const tx = await this.spCoinContractDeployed.depositStakingRewards(AGENT, _sponsorAccount, _recipientAccount, _recipientRate, _agentAccount, _agentRate, _amount);
            spCoinLogger.logExitFunction();
            return tx;
        };
        this.spCoinContractDeployed = _spCoinContractDeployed;
        spCoinLogger = new SpCoinLogger(_spCoinContractDeployed);
    }
}
exports.SpCoinStakingModule = SpCoinStakingModule;
