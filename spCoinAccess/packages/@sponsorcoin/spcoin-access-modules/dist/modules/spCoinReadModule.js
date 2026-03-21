"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpCoinReadModule = void 0;
// @ts-nocheck
// File: /@sponsorcoin/spcoin-access-modules/modules/spCoinReadModule.js
const { SpCoinLogger } = require("../utils/logging");
const { RewardAccountStruct, AccountStruct, AgentRateStruct, AgentStruct, RecipientStruct, RecipientRateStruct, RewardRateStruct, RewardsStruct, RewardTransactionStruct, RewardTypeStruct, StakingTransactionStruct } = require("../dataTypes/spCoinDataTypes");
const { SpCoinSerialize, bigIntToDecString, bigIntToDateTimeString, getLocation } = require("../utils//serialize");
const SPONSOR = 0;
const RECIPIENT = 1;
const AGENT = 2;
let spCoinLogger;
let spCoinSerialize;
//////////////////////////// ROOT LEVEL FUNCTIONS ////////////////////////////
class SpCoinReadModule {
    constructor(_spCoinContractDeployed) {
        this.getAccountList = async () => {
            spCoinLogger.logFunctionHeader("getAccountList = async()");
            let insertedAccountList = await this.spCoinContractDeployed.getAccountList();
            spCoinLogger.logExitFunction();
            return insertedAccountList;
        };
        this.getAccountListSize = async () => {
            spCoinLogger.logFunctionHeader("getAccountListSize = async()");
            let maxSize = (await this.getAccountList()).length;
            spCoinLogger.logDetail("JS => Found " + maxSize + " Account Keys");
            spCoinLogger.logExitFunction();
            return maxSize;
        };
        this.getAccountRecipientList = async (_accountKey) => {
            // console.log("JS==>4 getAccountRecipientList = async(" + _accountKey + ")");
            spCoinLogger.logFunctionHeader("getAccountRecipientList = async(" + _accountKey + ")");
            let recipientAccountList = await this.spCoinContractDeployed.getAccountRecipientList(_accountKey);
            spCoinLogger.logExitFunction();
            return recipientAccountList;
        };
        this.getAccountRecipientListSize = async (_accountKey) => {
            // console.log("JS==>20 getAccountRecipientListSize = async(" + _accountKey + ")");
            spCoinLogger.logFunctionHeader("getAccountRecipientListSize = async(" + _accountKey + ")");
            let maxSize = (await this.getAccountRecipientList(_accountKey)).length;
            spCoinLogger.logDetail("JS => Found " + maxSize + " Account Recipient Keys");
            spCoinLogger.logExitFunction();
            return maxSize;
        };
        this.getAccountRecord = async (_accountKey) => {
            // console.log("JS==>2 getAccountRecord = async(", _accountKey,")");
            let accountStruct = await spCoinSerialize.getAccountRecordObject(_accountKey);
            accountStruct.accountKey = _accountKey;
            let recipientAccountList = await this.getAccountRecipientList(_accountKey);
            accountStruct.recipientRecordList = await this.getRecipientRecordList(_accountKey, recipientAccountList);
            accountStruct.stakingRewardList = await this.getAccountStakingRewards(_accountKey);
            spCoinLogger.logExitFunction();
            return accountStruct;
        };
        this.getAccountStakingRewards = async (_accountKey) => {
            // console.log ("JS==>1 ===================================================================================================");
            // console.log("JS==>1.1 getAccountStakingRewards = async(", spCoinLogger.getJSON(_accountKey),")");
            let rewardsRecord = new RewardsStruct();
            let accountRewardsValue = await spCoinSerialize.getAccountRewardsValue(_accountKey);
            let accountRewardsStr = typeof accountRewardsValue === 'string'
                ? accountRewardsValue
                : [
                    accountRewardsValue.sponsorRewardsList?.stakingRewards ?? 0,
                    accountRewardsValue.recipientRewardsList?.stakingRewards ?? 0,
                    accountRewardsValue.agentRewardsList?.stakingRewards ?? 0,
                ].join(",");
            let accountRewardList = accountRewardsStr.split(",");
            // rewardsRecord.stakingRewards  = bigIntToDecString(accountRewardList[3]);
            /* REPLACE LATER */
            rewardsRecord.sponsorRewardsList = await this.getRewardTypeRecord(_accountKey, SPONSOR, accountRewardList[0]);
            rewardsRecord.recipientRewardsList = await this.getRewardTypeRecord(_accountKey, RECIPIENT, accountRewardList[1]);
            rewardsRecord.agentRewardsList = await this.getRewardTypeRecord(_accountKey, AGENT, accountRewardList[2]);
            // console.log("JS==>1.2 accountRewardList(", _accountKey, ") =", spCoinLogger.getJSON(accountRewardList));
            // console.log("JS==>1.3 rewardsRecord.agentRewardsList(", _accountKey, ", SPONSOR) =", spCoinLogger.getJSON(rewardsRecord));
            spCoinLogger.logExitFunction();
            // console.log ("===================================================================================================\n\n");
            return rewardsRecord;
        };
        this.getRewardTypeRecord = async (_accountKey, _rewardType, _reward) => {
            // console.log("JS==>6 getRewardTransactionsByAccountList = async(", _accountKey, ", ", getRewardType(_rewardType), ", ", _reward,")");
            let rewardTypeRecord = new RewardTypeStruct();
            rewardTypeRecord.TYPE = getRewardType(_rewardType);
            rewardTypeRecord.stakingRewards = bigIntToDecString(_reward);
            let rewardAccountList;
            let rewardsStr = "";
            try {
                rewardsStr = await this.spCoinContractDeployed.getRewardAccounts(_accountKey, _rewardType);
            }
            catch (_error) {
                rewardsStr = "";
            }
            // console.log ("JS==>6.1 rewardsStr.length = ", rewardsStr.length);
            // console.log ("JS==>6.2 rewardsStr = ", rewardsStr);
            if (rewardsStr.length > 0) {
                // console.log ("JS==>6.3 getSourceTypeDelimiter(_rewardType) = ", getSourceTypeDelimiter(_rewardType));
                rewardAccountList = rewardsStr.split(getSourceTypeDelimiter(_rewardType));
                rewardTypeRecord.rewardAccountList = this.getAccountRewardTransactionList(rewardAccountList);
            }
            else
                rewardAccountList = [];
            // console.log ("JS==>6.4 rewardsStr = ", spCoinLogger.getJSON(rewardsStr));
            // console.log ("JS==>6.5 rewardAccountList(" + getRewardType(_rewardType) + ").length = ", rewardAccountList.length);
            // console.log ("JS==>6.6 rewardAccountList(" + getRewardType(_rewardType) + ") = ", rewardAccountList);
            // spCoinLogger.logJSON(rewardTypeRecord);
            spCoinLogger.logExitFunction();
            return rewardTypeRecord;
        };
        this.getAccountRewardTransactionList = (_rewardAccountList) => {
            // console.log("JS==>5 getAccountRewardTransactionList = (_rewardAccountList = ", _rewardAccountList,")");
            let rewardTransactionsByAccountList = [];
            for (var idx = _rewardAccountList.length - 1; idx >= 1; idx--) {
                let rewardAccountRecord = this.getAccountRewardTransactionRecord(_rewardAccountList[idx]);
                rewardTransactionsByAccountList.push(rewardAccountRecord);
            }
            // spCoinLogger.logJSON(rewardTransactionsByAccountList);
            spCoinLogger.logExitFunction();
            return rewardTransactionsByAccountList;
        };
        this.getAccountRewardTransactionRecord = (_rewardRecordStr) => {
            let rateRewardList = _rewardRecordStr.split("\nRATE:");
            // console.log ("rateRewardList.length = ",rateRewardList.length);
            // console.log ("JS=>2.0 BEFORE rateRewardList = ",rateRewardList);
            let rewardAccountRecord;
            if (rateRewardList.length > 0) {
                rewardAccountRecord = new RewardAccountStruct();
                let rewardRecordFields = rateRewardList.shift().split(",");
                // console.log ("JS=>2.1 AFTER rateRewardList = ",rateRewardList);
                if (rateRewardList.length > 0) {
                    rewardAccountRecord.sourceKey = rewardRecordFields[0];
                    rewardAccountRecord.stakingRewards = bigIntToDecString(rewardRecordFields[1]);
                    rewardAccountRecord.rateList = this.getAccountRateRecordList(rateRewardList);
                }
            }
            spCoinLogger.logExitFunction();
            return rewardAccountRecord;
        };
        // GOOD TO HERE
        this.getAccountRateRecordList = (rateRewardList) => {
            spCoinLogger.logFunctionHeader("getAccountRateRecordList = (" + rateRewardList + ")");
            // console.log ("\n\n\n*********************** getRateRecord = (rateRecordRows) **************************");
            // console.log ("JS=>3.0 rateRewardList.length = ", rateRewardList.length);
            // console.log ("JS=>3.1 rateRewardList        = ", rateRewardList);
            let rateList = [];
            for (var idx = rateRewardList.length - 1; idx >= 0; idx--) {
                let rateReward = rateRewardList[idx];
                let rewardRateRecord = new RewardRateStruct();
                // console.log ("JS=>3.2 BEFORE rateReward = ",rateReward);
                let rateRewardTransactions = rateReward.split("\n");
                // console.log ("JS=>3.3 AFTER rateReward = ",rateReward);
                // console.log ("JS=>3.4 BEFORE rateRewardTransactions.length = ", rateRewardTransactions.length);
                let rateRewardHeaderFields = rateRewardTransactions.shift().split(",");
                rewardRateRecord.rate = bigIntToDecString(rateRewardHeaderFields[0]);
                rewardRateRecord.stakingRewards = bigIntToDecString(rateRewardHeaderFields[1]);
                // console.log ("JS=>3.5 AFTER rateRewardTransactions.length = ", rateRewardTransactions.length);
                // console.log ("JS=>3.6 AFTER rateRewardTransactions = ", rateRewardTransactions);
                rewardRateRecord.rewardTransactionList = this.getRateTransactionList(rateRewardTransactions);
                rateList.push(rewardRateRecord);
            }
            spCoinLogger.logExitFunction();
            return rateList;
        };
        this.getRateTransactionList = (rewardRateRowList) => {
            // console.log ("\n\n\n*********************** getRateTransactionList = (rewardRateRowList) **************************");
            // console.log ("JS=>6 rewardRateRowList.length = ", rewardRateRowList.length);
            // console.log ("JS=>7 rewardRateRowList        = ", rewardRateRowList);
            let rateTransactionList = [];
            for (var row = rewardRateRowList.length - 1; row >= 0; row--) {
                // console.log ("JS=>8 rewardRateRowList["+row+"] = ", rewardRateRowList[row]);
                let accountRewardsFields = rewardRateRowList[row].split(",");
                let rewardTransactionRecord = new RewardTransactionStruct();
                let count = 0;
                // rewardTransactionRecord.sourceKey = accountRewardsFields[count++];
                // console.log ("JS=>9 accountRewardsFields[count] = ", accountRewardsFields[count]);
                rewardTransactionRecord.updateTime = bigIntToDateTimeString(accountRewardsFields[count++]);
                // console.log ("JS=>11 rewardTransactionRecord.updateTime = ", rewardTransactionRecord.updateTime);
                rewardTransactionRecord.stakingRewards = bigIntToDecString(accountRewardsFields[count++]);
                // console.log ("JS=>12 rewardTransactionRecord.stakingRewards = ", rewardTransactionRecord.stakingRewards);
                // console.log ("JS=>3 rewardTransactionRecord = ",rewardTransactionRecord);
                rateTransactionList.push(rewardTransactionRecord);
            }
            // ToDo: call getRateTransactionList BELOW
            // console.log(JSON.stringify(rateTransactionList, null, 2));
            // spCoinLogger.logJSON(rateTransactionList);
            spCoinLogger.logExitFunction();
            return rateTransactionList;
        };
        this.getSPCoinHeaderRecord = async (getBody) => {
            // console.log("JS==>1 getAccountRecords()");
            spCoinLogger.logFunctionHeader("getAccountRecords()");
            let sponsorCoinHeader = await spCoinSerialize.getSPCoinHeaderObject();
            sponsorCoinHeader.location = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (getBody) {
                const accountRecords = await this.getAccountRecords();
                sponsorCoinHeader.accountRecords = Array.isArray(accountRecords) ? accountRecords : [];
            }
            return sponsorCoinHeader;
        };
        this.getSpCoinMetaData = async () => {
            spCoinLogger.logFunctionHeader("getSpCoinMetaData()");
            const normalizeRangeTuple = (value) => {
                if (Array.isArray(value)) {
                    return [Number(value?.[0] ?? 0), Number(value?.[1] ?? 0)];
                }
                return [0, Number(value ?? 0)];
            };
            const getRateRangeTuple = async (rangeReader, lowerReader, upperReader) => {
                const rangeFn = this.spCoinContractDeployed?.[rangeReader];
                if (typeof rangeFn === "function") {
                    const rangeResult = await rangeFn.call(this.spCoinContractDeployed);
                    return normalizeRangeTuple(rangeResult);
                }
                const lowerFn = this.spCoinContractDeployed?.[lowerReader];
                const upperFn = this.spCoinContractDeployed?.[upperReader];
                if (typeof lowerFn === "function" && typeof upperFn === "function") {
                    const [lowerRate, upperRate] = await Promise.all([
                        lowerFn.call(this.spCoinContractDeployed),
                        upperFn.call(this.spCoinContractDeployed),
                    ]);
                    return [Number(lowerRate ?? 0), Number(upperRate ?? 0)];
                }
                return [0, 0];
            };
            if (typeof this.spCoinContractDeployed.getSpCoinMetaData === "function") {
                const ret = await this.spCoinContractDeployed.getSpCoinMetaData();
                const [recipientRateRange, agentRateRange] = await Promise.all([
                    getRateRangeTuple("getRecipientRateRange", "getLowerRecipientRate", "getUpperRecipientRate"),
                    getRateRangeTuple("getAgentRateRange", "getLowerAgentRate", "getUpperAgentRate"),
                ]);
                spCoinLogger.logExitFunction();
                return {
                    version: String(ret?.[0] ?? ""),
                    name: String(ret?.[1] ?? ""),
                    symbol: String(ret?.[2] ?? ""),
                    decimals: Number(ret?.[3] ?? 0),
                    totalSupply: String(ret?.[4] ?? "0"),
                    inflationRate: Number(ret?.[5] ?? 0),
                    recipientRateRange,
                    agentRateRange,
                };
            }
            const readOptionalValue = async (readers, fallbackValue) => {
                for (const reader of readers) {
                    const contractReader = this.spCoinContractDeployed?.[reader];
                    if (typeof contractReader !== "function")
                        continue;
                    try {
                        return await contractReader.call(this.spCoinContractDeployed);
                    }
                    catch (_error) {
                        continue;
                    }
                }
                return fallbackValue;
            };
            const [version, name, symbol, decimals, totalSupply, inflationRate, recipientRateRange, agentRateRange] = await Promise.all([
                readOptionalValue(["getVersion"], ""),
                readOptionalValue(["name"], ""),
                readOptionalValue(["symbol"], ""),
                readOptionalValue(["decimals"], 0),
                readOptionalValue(["totalSupply"], "0"),
                readOptionalValue(["getInflationRate"], 10),
                getRateRangeTuple("getRecipientRateRange", "getLowerRecipientRate", "getUpperRecipientRate"),
                getRateRangeTuple("getAgentRateRange", "getLowerAgentRate", "getUpperAgentRate"),
            ]);
            spCoinLogger.logExitFunction();
            return {
                version: String(version ?? ""),
                name: String(name ?? ""),
                symbol: String(symbol ?? ""),
                decimals: Number(decimals ?? 0),
                totalSupply: String(totalSupply ?? "0"),
                inflationRate: Number(inflationRate ?? 0),
                recipientRateRange: normalizeRangeTuple(recipientRateRange),
                agentRateRange: normalizeRangeTuple(agentRateRange),
            };
        };
        this.getAccountRecords = async () => {
            // console.log("JS==>1 getAccountRecords()");
            spCoinLogger.logFunctionHeader("getAccountRecords()");
            let accountArr = [];
            // let accountList = await this.spCoinContractDeployed.getAccountList();
            let accountList = await this.getAccountList();
            for (let i in accountList) {
                let accountStruct = await this.getAccountRecord(accountList[i]);
                accountArr.push(accountStruct);
            }
            spCoinLogger.logExitFunction();
            return accountArr;
        };
        //////////////////// LOAD AGENT _rewardTransactionList DATA //////////////////////
        this.getAgentRateList = async (_sponsorKey, _recipientKey, _recipientRateKey, _agentKey) => {
            // console.log("JS==>17 getAgentRateList = async(" + _sponsorKey + ", " + _recipientKey + ", " + _recipientRateKey + ", " + _agentKey + ")" );
            spCoinLogger.logFunctionHeader("getAgentRateList = async(" + _sponsorKey + ", " + _recipientKey + ", " + _recipientRateKey + ", " + _agentKey + ")");
            let networkRateKeys = await this.spCoinContractDeployed.getAgentRateList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey);
            let agentRateList = [];
            for (let [idx, netWorkRateKey] of Object.entries(networkRateKeys)) {
                // agentRateList.push(netWorkRateKey.toNumber());
                agentRateList.push(netWorkRateKey);
            }
            spCoinLogger.logExitFunction();
            return agentRateList;
        };
        this.getAgentRateRecord = async (_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey) => {
            // console.log("JS==>18.0 getAgentRateRecord(\n   _sponsorKey = " + _sponsorKey + ",\n   _recipientKey = " + _recipientKey + ",\n   _agentKey = " + _agentKey+ ",\n   _agentRateKey = " + _agentRateKey + ")");
            spCoinLogger.logFunctionHeader("getAgentRateRecord(" + _sponsorKey + ", " + _recipientKey + ", " + _agentKey + ", " + _agentRateKey + ")");
            let agentRateRecord = new AgentRateStruct();
            let recordStr = ["0", "0", "0"];
            try {
                recordStr = await spCoinSerialize.getAgentRateRecordFields(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey);
            }
            catch (_error) {
                recordStr = ["0", "0", "0"];
            }
            agentRateRecord.agentRate = _agentRateKey;
            // console.log("JS==>18.1 agentRateRecord.agentRate = ", agentRateRecord.agentRate);
            agentRateRecord.creationTime = bigIntToDateTimeString(recordStr[0]);
            agentRateRecord.lastUpdateTime = bigIntToDateTimeString(recordStr[1]);
            // console.log("JS==>18.2 agentRateRecord.lastUpdateTime = ", bigIntToDecString(recordStr[1]));
            // console.log("JS==>18.3 agentRateRecord.lastUpdateTime = ", agentRateRecord.lastUpdateTime);
            // console.log()
            agentRateRecord.stakedSPCoins = bigIntToDecString(recordStr[2]);
            // console.log("JS==>18.4 agentRateRecord.stakedSPCoins = ", agentRateRecord.stakedSPCoins);
            try {
                agentRateRecord.transactions = await this.getAgentRateTransactionList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey);
            }
            catch (_error) {
                agentRateRecord.transactions = [];
            }
            spCoinLogger.logExitFunction();
            return agentRateRecord;
        };
        this.getAgentRateRecordList = async (_sponsorKey, _recipientKey, _recipientRateKey, _agentKey) => {
            // console.log("JS==>16.0 getAgentRateRecordList = async(" + _recipientKey+ ", " + _agentKey + ")");
            spCoinLogger.logFunctionHeader("getAgentRateRecordList(" + ", " + _sponsorKey + ", " + _recipientKey + ", " + _recipientRateKey + ", " + _agentKey + ")");
            let agentRateList = await this.getAgentRateList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey);
            // console.log("JS==>16.1 getAgentRateRecordList:agentRateList = ", agentRateList);
            let agentRateRecordList = [];
            for (let [idx, agentRateKey] of Object.entries(agentRateList)) {
                let agentRateRecord = await this.getAgentRateRecord(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, agentRateKey);
                agentRateRecordList.push(agentRateRecord);
            }
            spCoinLogger.logExitFunction();
            return agentRateRecordList;
        };
        //////////////////// LOAD AGENT TRANSACTION DATA //////////////////////
        this.getAgentRecord = async (_sponsorKey, _recipientKey, _recipientRateKey, _agentKey) => {
            // console.log("JS==>15 getAgentRecord = async(" + ", " + _sponsorKey + ", " + _recipientKey + ", " + _recipientRateKey + ", " + _agentKey + ")");
            spCoinLogger.logFunctionHeader("getAgentRecord = async(" + ", " + _sponsorKey + ", " + _recipientKey + ", " + _recipientRateKey + ", " + _agentKey + ")");
            let agentRecord = new AgentStruct();
            agentRecord.agentKey = _agentKey;
            agentRecord.stakedSPCoins = bigIntToDecString(await this.spCoinContractDeployed.getAgentTotalRecipient(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey));
            agentRecord.agentRateList = await this.getAgentRateRecordList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey);
            spCoinLogger.logExitFunction();
            return agentRecord;
        };
        this.getAgentRecordList = async (_sponsorKey, _recipientKey, _recipientRateKey, _agentAccountList) => {
            // console.log("JS==>14 getAgentRecordList = async("+_sponsorKey, + ", " + _recipientKey + ", " + _recipientRateKey + ")");
            spCoinLogger.logFunctionHeader("getAgentRecordList = async(" + _sponsorKey, +", " + _recipientKey + ", " + _recipientRateKey + ")");
            let agentRecordList = [];
            for (let [idx, agentKey] of Object.entries(_agentAccountList)) {
                let agentRecord = await this.getAgentRecord(_sponsorKey, _recipientKey, _recipientRateKey, agentKey);
                agentRecordList.push(agentRecord);
            }
            spCoinLogger.logExitFunction();
            return agentRecordList;
        };
        this.getAgentRateTransactionList = async (_sponsorCoin, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey) => {
            // console.log("JS==>18.0 getAgentRateTransactionList = async(" + _recipientKey + ", " + _recipientRateKey + ", " + _agentKey + ", " + _agentRateKey + ")");
            spCoinLogger.logFunctionHeader("getAgentRateTransactionList = async(" + _recipientKey + ", " + _recipientRateKey + ", " + _agentKey + ", " + _agentRateKey + ")");
            let agentRateTransactionList = "";
            try {
                agentRateTransactionList = await this.spCoinContractDeployed.getSerializedRateTransactionList(_sponsorCoin, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey);
            }
            catch (_error) {
                agentRateTransactionList = "";
            }
            spCoinLogger.logExitFunction();
            return spCoinSerialize.deserializeRateTransactionRecords(agentRateTransactionList);
        };
        /////////////////////// RECIPIENT RECORD FUNCTIONS ///////////////////////
        this.getRecipientRateAgentList = async (_sponsorKey, _recipientKey, _recipientRateKey) => {
            // console.log("JS==>13 getRecipientRateAgentList = async(" + _sponsorKey + ", " + _recipientKey + ", " + _recipientRateKey + ")" );
            spCoinLogger.logFunctionHeader("getRecipientRateAgentList = async(" + _sponsorKey + ", " + _recipientKey + ", " + _recipientRateKey + ")");
            let agentAccountList = [];
            try {
                agentAccountList = await this.spCoinContractDeployed.getRecipientRateAgentList(_sponsorKey, _recipientKey, _recipientRateKey);
            }
            catch (_error) {
                agentAccountList = [];
            }
            spCoinLogger.logExitFunction();
            return agentAccountList;
        };
        this.getRecipientRateRecord = async (_sponsorKey, _recipientKey, _recipientRateKey) => {
            // console.log("JS==>10.0 getRecipientRateRecord(" + _sponsorKey + ", " + _recipientKey + ", " + _recipientRateKey + ")");
            spCoinLogger.logFunctionHeader("getRecipientRateRecord(" + _sponsorKey + _recipientKey + ", " + _recipientRateKey + ")");
            let recipientRateRecord = new RecipientRateStruct();
            let recordStr = await spCoinSerialize.getRecipientRateRecordFields(_sponsorKey, _recipientKey, _recipientRateKey);
            // console.log("JS==>10.1 getRecipientRateRecord: recordStr = ", recordStr);
            let agentAccountList = [];
            try {
                agentAccountList = await this.getRecipientRateAgentList(_sponsorKey, _recipientKey, _recipientRateKey);
            }
            catch (_error) {
                agentAccountList = [];
            }
            // console.log("JS==>10.2 getRecipientRateRecord: agentAccountList = ", agentAccountList);
            recipientRateRecord.recipientRate = _recipientRateKey;
            recipientRateRecord.creationTime = bigIntToDateTimeString(recordStr[0]);
            recipientRateRecord.lastUpdateTime = bigIntToDateTimeString(recordStr[1]);
            recipientRateRecord.stakedSPCoins = bigIntToDecString(recordStr[2]);
            try {
                recipientRateRecord.transactions = await this.getRecipientRateTransactionList(_sponsorKey, _recipientKey, _recipientRateKey);
            }
            catch (_error) {
                recipientRateRecord.transactions = [];
            }
            try {
                recipientRateRecord.agentRecordList = await this.getAgentRecordList(_sponsorKey, _recipientKey, _recipientRateKey, agentAccountList);
            }
            catch (_error) {
                recipientRateRecord.agentRecordList = [];
            }
            spCoinLogger.logExitFunction();
            return recipientRateRecord;
        };
        this.getRecipientRateRecordList = async (_sponsorKey, _recipientKey) => {
            // console.log("JS==>8 getRecipientRateRecordList = async(" + _sponsorKey +","  + _recipientKey + ")");
            spCoinLogger.logFunctionHeader("getRecipientRateRecordList = async(" + _sponsorKey + "," + _recipientKey + ")");
            let networkRateList = await this.getRecipientRateList(_sponsorKey, _recipientKey);
            let recipientRateRecordList = [];
            for (let [idx, recipientRateKey] of Object.entries(networkRateList)) {
                //log("JS => Loading Recipient Rates " + recipientRateKey + " idx = " + idx);
                let recipientRateRecord = await this.getRecipientRateRecord(_sponsorKey, _recipientKey, recipientRateKey);
                recipientRateRecordList.push(recipientRateRecord);
            }
            spCoinLogger.logExitFunction();
            return recipientRateRecordList;
        };
        this.getRecipientRecord = async (_sponsorKey, _recipientKey) => {
            // console.log("JS==>6 getRecipientRecord = async(" + _sponsorKey + ", ", + _recipientKey + ")");
            spCoinLogger.logFunctionHeader("getRecipientRecord = async(" + _sponsorKey, +",", +_recipientKey + ")");
            let recipientRecord = new RecipientStruct(_recipientKey);
            recipientRecord.recipientKey = _recipientKey;
            let recordStr = await spCoinSerialize.getRecipientRecordFields(_sponsorKey, _recipientKey);
            recipientRecord.creationTime = bigIntToDateTimeString(recordStr[0]);
            recipientRecord.stakedSPCoins = bigIntToDecString(recordStr[1]);
            // ToDo New Robin
            recipientRecord.recipientRateList = await this.getRecipientRateRecordList(_sponsorKey, _recipientKey);
            spCoinLogger.logExitFunction();
            return recipientRecord;
        };
        this.getRecipientRecordList = async (_sponsorKey, _recipientAccountList) => {
            // console.log("JS==>5 getRecipientRecordList = async(" +_sponsorKey + ","+ _recipientAccountList + ")");
            spCoinLogger.logFunctionHeader("getRecipientRecordList = async(" + _sponsorKey + "," + _recipientAccountList + ")");
            let recipientRecordList = [];
            for (let [idx, recipientKey] of Object.entries(_recipientAccountList)) {
                spCoinLogger.logDetail("JS => Loading Recipient Record " + recipientKey, idx);
                let recipientRecord = await this.getRecipientRecord(_sponsorKey, recipientKey);
                recipientRecordList.push(recipientRecord);
            }
            spCoinLogger.logExitFunction();
            return recipientRecordList;
        };
        this.getRecipientRateList = async (_sponsorKey, _recipientKey) => {
            spCoinLogger.logFunctionHeader("getRecipientRateList = async(" + _sponsorKey + "," + _recipientKey + ")");
            // console.log("JS==>9 getRecipientRateList = async(" + _sponsorKey +","  + _recipientKey + ")");
            let networkRateKeys = await this.spCoinContractDeployed.getRecipientRateList(_sponsorKey, _recipientKey);
            let recipientRateList = [];
            for (let [idx, netWorkRateKey] of Object.entries(networkRateKeys)) {
                // console.debug(`idx = ${idx} netWorkRateKey = ${netWorkRateKey} = ${typeof(netWorkRateKey)}`)
                // recipientRateList.push(netWorkRateKey.toNumber());
                recipientRateList.push(netWorkRateKey);
            }
            spCoinLogger.logExitFunction();
            return recipientRateList;
        };
        this.getRecipientRateTransactionList = async (_sponsorCoin, _recipientKey, _recipientRateKey) => {
            // console.log("JS==>18 getRecipientRateTransactionList = async(" + _recipientKey + ", " + _recipientRateKey + ")");
            spCoinLogger.logFunctionHeader("getRecipientRateTransactionList = async(" + _recipientKey + ", " + _recipientRateKey + ")");
            let agentRateTransactionList = "";
            try {
                agentRateTransactionList = await this.spCoinContractDeployed.getRecipientRateTransactionList(_sponsorCoin, _recipientKey, _recipientRateKey);
            }
            catch (_error) {
                agentRateTransactionList = "";
            }
            spCoinLogger.logExitFunction();
            return spCoinSerialize.deserializeRateTransactionRecords(agentRateTransactionList);
        };
        this.spCoinContractDeployed = _spCoinContractDeployed;
        spCoinSerialize = new SpCoinSerialize(_spCoinContractDeployed);
        spCoinLogger = new SpCoinLogger(_spCoinContractDeployed);
    }
}
exports.SpCoinReadModule = SpCoinReadModule;
const getRewardType = (_accountType) => {
    return getAccountTypeString(_accountType) + " REWARDS";
};
const getAccountTypeString = (_accountType) => {
    let strAccountType = "";
    if (_accountType == SPONSOR)
        return "SPONSOR";
    else if (_accountType == RECIPIENT)
        return "RECIPIENT";
    else if (_accountType == AGENT)
        return "AGENT";
    return strAccountType;
};
const getSourceTypeDelimiter = (_accountType) => {
    if (_accountType == SPONSOR)
        return "RECIPIENT_ACCOUNT:";
    else if (_accountType == RECIPIENT)
        return "SPONSOR_ACCOUNT:";
    else if (_accountType == AGENT)
        return "RECIPIENT_ACCOUNT:";
};
