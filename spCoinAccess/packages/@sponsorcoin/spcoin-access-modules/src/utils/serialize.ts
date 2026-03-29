// @ts-nocheck
// @ts-nocheck
// File: /@sponsorcoin/spcoin-access-modules/utils/serialize.js
// const {  spCoinContractDeployed } = require("../contracts/spCoin");
// const { BigNumber, ethers, utils } = require("ethers");
import { Interface } from "ethers";
import { SpCoinLogger } from "./logging";
import { formatTimeSeconds } from "./dateTime";
import { bigIntToDateTimeString, bigIntToDecString, bigIntToHexString, bigIntToString, getLocation } from "./dateTime";
import { SponsorCoinHeader, AccountStruct, RecipientStruct, AgentStruct, AgentRateStruct, StakingTransactionStruct, } from "../dataTypes/spCoinDataTypes";
let spCoinLogger;
export const accountRewardTotalsInterface = new Interface([
    'function getAccountRewardTotals(address _accountKey) view returns (uint256 sponsorRewards, uint256 recipientRewards, uint256 agentRewards)',
]);
export const accountCoreInterface = new Interface([
    'function getAccountCore(address _accountKey) view returns (address accountKey, uint256 creationTime, bool verified, uint256 accountBalance, uint256 stakedAccountSPCoins, uint256 accountStakingRewards)',
]);
export const accountLinksInterface = new Interface([
    'function getAccountLinks(address _accountKey) view returns (address[] sponsorAccountList, address[] recipientAccountList, address[] agentAccountList, address[] agentParentRecipientAccountList)',
]);
export const recipientRecordCoreInterface = new Interface([
    'function getRecipientRecordCore(address _sponsorKey, address _recipientKey) view returns (uint256 creationTime, uint256 stakedSPCoins, bool inserted)',
]);
export const recipientRateRecordCoreInterface = new Interface([
    'function getRecipientRateRecordCore(address _sponsorKey, address _recipientKey, uint256 _recipientRateKey) view returns (uint256 recipientRate, uint256 creationTime, uint256 lastUpdateTime, uint256 stakedSPCoins, bool inserted)',
]);
export const agentRateRecordCoreInterface = new Interface([
    'function getAgentRateRecordCore(address _sponsorKey, address _recipientKey, uint256 _recipientRateKey, address _agentKey, uint256 _agentRateKey) view returns (uint256 agentRate, uint256 creationTime, uint256 lastUpdateTime, uint256 stakedSPCoins, bool inserted)',
]);
export async function callViewFunction(contract, iface, functionName, args) {
    const target = String((contract === null || contract === void 0 ? void 0 : contract.target) || (typeof (contract === null || contract === void 0 ? void 0 : contract.getAddress) === 'function' ? await contract.getAddress() : ''));
    const runner = contract === null || contract === void 0 ? void 0 : contract.runner;
    if (!target || !runner || typeof runner.call !== 'function') {
        throw new Error(`${functionName} runner unavailable.`);
    }
    const data = iface.encodeFunctionData(functionName, args);
    const raw = await runner.call({ to: target, data });
    return iface.decodeFunctionResult(functionName, raw);
}
export async function readAnnualInflation(contract) {
    if (typeof (contract === null || contract === void 0 ? void 0 : contract.getInflationRate) === "function") {
        try {
            return await contract.getInflationRate();
        }
        catch (_a) {
            // Fall back for older deployments that still expose annualInflation().
        }
    }
    if (typeof (contract === null || contract === void 0 ? void 0 : contract.annualInflation) === "function") {
        try {
            return await contract.annualInflation();
        }
        catch (_b) {
            // Fall through to the historical default below.
        }
    }
    return 10;
}
export function normalizeAddress(value) {
    return String(value || '').trim().toLowerCase();
}
export function normalizeAddressList(values) {
    return values.map((value) => normalizeAddress(value)).join(',');
}
export async function buildSerializedAccountRecordFallback(contract, accountKey) {
    const [normalizedAccountKey, creationTime, verified, accountBalance, stakedAccountSPCoins, accountStakingRewards] = await callViewFunction(contract, accountCoreInterface, 'getAccountCore', [accountKey]);
    const [sponsorAccountList, recipientAccountList, agentAccountList, agentParentRecipientAccountList] = await callViewFunction(contract, accountLinksInterface, 'getAccountLinks', [accountKey]);
    let serialized = `accountKey: ${normalizeAddress(normalizedAccountKey)}\\,\ncreationTime: ${String(creationTime)}\\,\nverified: ${Boolean(verified) ? 'true' : 'false'}`;
    serialized += `\\,balanceOf: ${String(accountBalance)}`;
    serialized += `\\,stakedSPCoins: ${String(stakedAccountSPCoins)}`;
    serialized += `\\,sponsorAccountList:${normalizeAddressList(Array.from(sponsorAccountList || []))}`;
    serialized += `\\,recipientAccountList:${normalizeAddressList(Array.from(recipientAccountList || []))}`;
    serialized += `\\,agentAccountList:${normalizeAddressList(Array.from(agentAccountList || []))}`;
    serialized += `\\,agentParentRecipientAccountList:${normalizeAddressList(Array.from(agentParentRecipientAccountList || []))}`;
    serialized += `\\,stakingRewards: ${String(accountStakingRewards)}`;
    return serialized;
}
export async function buildSerializedAccountRewardsFallback(contract, accountKey) {
    const [sponsorRewards, recipientRewards, agentRewards] = await callViewFunction(contract, accountRewardTotalsInterface, 'getAccountRewardTotals', [accountKey]);
    return [String(sponsorRewards), String(recipientRewards), String(agentRewards)].join(",");
}
export async function buildSerializedRecipientRecordFallback(contract, sponsorKey, recipientKey) {
    const [creationTime, stakedSPCoins] = await callViewFunction(contract, recipientRecordCoreInterface, 'getRecipientRecordCore', [sponsorKey, recipientKey]);
    return `${String(creationTime)},${String(stakedSPCoins)}`;
}
export async function buildSerializedRecipientRateFallback(contract, sponsorKey, recipientKey, recipientRateKey) {
    const [, creationTime, lastUpdateTime, stakedSPCoins] = await callViewFunction(contract, recipientRateRecordCoreInterface, 'getRecipientRateRecordCore', [sponsorKey, recipientKey, recipientRateKey]);
    return `${String(creationTime)},${String(lastUpdateTime)},${String(stakedSPCoins)}`;
}
export async function buildSerializedAgentRateFallback(contract, sponsorKey, recipientKey, recipientRateKey, agentKey, agentRateKey) {
    const [, creationTime, lastUpdateTime, stakedSPCoins] = await callViewFunction(contract, agentRateRecordCoreInterface, 'getAgentRateRecordCore', [sponsorKey, recipientKey, recipientRateKey, agentKey, agentRateKey]);
    return `${String(creationTime)},${String(lastUpdateTime)},${String(stakedSPCoins)}`;
}
export class SpCoinSerialize {
    constructor(_spCoinContractDeployed) {
        this.setContract = (_spCoinContractDeployed) => {
            this.spCoinContractDeployed = _spCoinContractDeployed;
        };
        this.deSerializedAccountRec = async (_serializedAccountRec) => {
            // LOG_DETAIL = true;
            spCoinLogger.logFunctionHeader("deSerializedAccountRec = async(" + _serializedAccountRec + ")");
            spCoinLogger.logDetail("JS => _serializedAccountRec:\n" + _serializedAccountRec);
            let accountRecord = new AccountStruct();
            let elements = _serializedAccountRec.split("\\,");
            for (let i = 0; i < elements.length; i++) {
                let element = elements[i].trim();
                let keyValue = element.split(":");
                spCoinLogger.logDetail("JS => keyValue = " + keyValue);
                let key = keyValue[0].trim();
                let value = keyValue[1].trim();
                // spCoinLogger.logDetail("JS => key     = " + key);
                // spCoinLogger.logDetail("JS => value   = " + value);
                this.addAccountField(key, value, accountRecord);
            }
            spCoinLogger.logDetail("JS => scPrintStructureTest.js, accountRecord:");
            spCoinLogger.logDetail("JS => accountRecord               = " + JSON.stringify(accountRecord, 0, 2));
            spCoinLogger.logDetail("JS => ============================================================================");
            spCoinLogger.logExitFunction();
            return accountRecord;
        };
        this.addAccountField = (_key, _value, accountRecord) => {
            spCoinLogger.logFunctionHeader("addAccountField = (" + _key + "," + _value + ")");
            // spCoinLogger.log("addAccountField = (" + _key + "," + _value + ")");
            switch (_key.trim()) {
                case "accountKey":
                    accountRecord.accountKey = _value;
                    break;
                case "balanceOf":
                    accountRecord.balanceOf = bigIntToDecString(_value);
                    break;
                case "stakingRewards":
                    accountRecord.stakingRewards = bigIntToDecString(_value);
                    break;
                case "decimals":
                    accountRecord.decimals = bigIntToDecString(_value);
                    break;
                case "stakedSPCoins":
                    accountRecord.stakedSPCoins = bigIntToDecString(_value);
                    break;
                case "creationTime":
                    accountRecord.creationTime = bigIntToDateTimeString(_value);
                    accountRecord.location = getLocation();
                    break;
                case "inserted":
                    accountRecord.inserted = _value;
                    break;
                case "verified":
                    accountRecord.verified = _value;
                    break;
                case "KYC":
                    accountRecord.KYC = _value;
                    break;
                case "sponsorAccountList":
                    accountRecord.sponsorAccountList = this.parseAddressStrRecord(_value);
                    break;
                case "recipientAccountList":
                    accountRecord.recipientAccountList = this.parseAddressStrRecord(_value);
                    break;
                case "agentAccountList":
                    accountRecord.agentAccountList = this.parseAddressStrRecord(_value);
                    break;
                case "agentParentRecipientAccountList":
                    accountRecord.agentParentRecipientAccountList = this.parseAddressStrRecord(_value);
                    break;
                case "recipientRecordList":
                    accountRecord.recipientRecordList = _value;
                    break;
                default:
                    break;
            }
            spCoinLogger.logExitFunction();
        };
        this.parseAddressStrRecord = (strRecord) => {
            if (strRecord == "") {
                spCoinLogger.logExitFunction();
                return [];
            }
            else {
                spCoinLogger.logFunctionHeader("parseAddressStrRecord = " + strRecord + ")");
                let addressStrRecord = strRecord.split(",");
                spCoinLogger.logExitFunction();
                return addressStrRecord;
            }
        };
        //////////////////////////////////////////////////////////////////////////////////////////////////////
        this.getRecipientRateRecordFields = async (_sponsorKey, _recipientKey, _recipientRateKey) => {
            // console.log("==>11 getSerializedRecipientRecordList = async(" + _sponsorKey + ", " + _recipientKey + ", "+ _recipientRateKey + ", " + ")");
            spCoinLogger.logFunctionHeader("getSerializedRecipientRateList = async(" + _sponsorKey + _recipientKey + ", " + _recipientRateKey + ")");
            let recipientRateRecordStr;
            try {
                recipientRateRecordStr = await this.spCoinContractDeployed.getSerializedRecipientRateList(_sponsorKey, _recipientKey, _recipientRateKey);
            }
            catch (_error) {
                recipientRateRecordStr = await buildSerializedRecipientRateFallback(this.spCoinContractDeployed, _sponsorKey, _recipientKey, _recipientRateKey);
            }
            let recipientRateList = recipientRateRecordStr.split(",");
            spCoinLogger.logExitFunction();
            return recipientRateList;
        };
        this.getRecipientRecordFields = async (_sponsorKey, _recipientKey) => {
            // console.log("==>7 getSerializedRecipientRecordList = async(" + _sponsorKey + ", " + _recipientKey+ ", " + ")");
            spCoinLogger.logFunctionHeader("getSerializedRecipientRecordList = async(" + _sponsorKey + ", " + _recipientKey + ", " + ")");
            let recipientRecordStr;
            try {
                recipientRecordStr = await this.spCoinContractDeployed.getSerializedRecipientRecordList(_sponsorKey, _recipientKey);
            }
            catch (_error) {
                recipientRecordStr = await buildSerializedRecipientRecordFallback(this.spCoinContractDeployed, _sponsorKey, _recipientKey);
            }
            let recipientRecordList = recipientRecordStr.split(",");
            spCoinLogger.logExitFunction();
            return recipientRecordList;
        };
        this.getAgentRateRecordFields = async (_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey) => {
            // console.log("==>19 getSerializedAgentRateList = async(", _recipientKey, _recipientRateKey, _agentKey, _agentRateKey, ")");
            spCoinLogger.logFunctionHeader("getSerializedAgentRateList = async(" + _sponsorKey + ", " + _recipientKey + ", " + _agentKey + ", " + _agentRateKey + ")");
            let agentRateRecordStr;
            try {
                agentRateRecordStr = await this.spCoinContractDeployed.serializeAgentRateRecordStr(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey);
            }
            catch (_error) {
                agentRateRecordStr = await buildSerializedAgentRateFallback(this.spCoinContractDeployed, _sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey);
            }
            let agentRateRecordStrList = agentRateRecordStr.split(",");
            spCoinLogger.logExitFunction();
            return agentRateRecordStrList;
        };
        this.getAccountRecordObject = async (_accountKey) => {
            // console.log("==>3 getSerializedAccountRecord = async(" + _accountKey + ")");
            spCoinLogger.logFunctionHeader("getSerializedAccountRecord = async(" + _accountKey + ")");
            let serializedAccountRec;
            try {
                serializedAccountRec = await this.spCoinContractDeployed.getSerializedAccountRecord(_accountKey);
            }
            catch (_error) {
                serializedAccountRec = await buildSerializedAccountRecordFallback(this.spCoinContractDeployed, _accountKey);
            }
            spCoinLogger.logExitFunction();
            return this.deSerializedAccountRec(serializedAccountRec);
        };
        this.getAccountRewardsValue = async (_accountKey) => {
            // console.log("==>3 getSerializedAccountRewards = async(" + _accountKey + ")");
            spCoinLogger.logFunctionHeader("getSerializedAccountRewards = async(" + _accountKey + ")");
            let serializedAccountRec;
            try {
                serializedAccountRec = await this.spCoinContractDeployed.getSerializedAccountRewards(_accountKey);
            }
            catch (_error) {
                serializedAccountRec = await buildSerializedAccountRewardsFallback(this.spCoinContractDeployed, _accountKey);
            }
            spCoinLogger.logExitFunction();
            if (typeof serializedAccountRec === 'string' && !serializedAccountRec.includes(':')) {
                return serializedAccountRec;
            }
            return this.deSerializedAccountRec(serializedAccountRec);
        };
        this.deserializeRateTransactionRecords = (transactionStr) => {
            spCoinLogger.logFunctionHeader("deserializeRateTransactionRecords = async(" + transactionStr + ")");
            //spCoinLogger.log("deserializeRateTransactionRecords = async(" + transactionStr + ")");
            let transactionRecs = [];
            if (transactionStr.length > 0) {
                // console.log("JS==>19 deserializeRateTransactionRecords = async(" + transactionStr + ")");
                let transactionRows = transactionStr.split("\n");
                // for (let row in transactionRows) {
                for (var row = transactionRows.length - 1; row >= 0; row--) {
                    let transactionFields = transactionRows[row].split(",");
                    let transactionRec = new StakingTransactionStruct();
                    transactionRec.location = getLocation();
                    transactionRec.insertionTime = bigIntToDateTimeString(transactionFields[0]);
                    transactionRec.quantity = bigIntToDecString(transactionFields[1]);
                    transactionRecs.push(transactionRec);
                    // spCoinLogger.logJSON(transactionRec);
                }
                spCoinLogger.logExitFunction();
            }
            return transactionRecs;
        };
        this.getSPCoinHeaderObject = async () => {
            // console.log("JS==>1 deserializedSPCoinHeader()");
            spCoinLogger.logFunctionHeader("getAccountRecords()");
            let sponsorCoinHeader = new SponsorCoinHeader();
            const versionReader = typeof this.spCoinContractDeployed.getVersion === "function"
                ? this.spCoinContractDeployed.getVersion.bind(this.spCoinContractDeployed)
                : this.spCoinContractDeployed.version.bind(this.spCoinContractDeployed);
            let [name, creationTime, decimals, totalSupply, initialTotalSupply, annualInflation, totalBalanceOf, totalStakingRewards, totalStakedSPCoins, symbol, version] = await Promise.all([
                this.spCoinContractDeployed.name(),
                this.spCoinContractDeployed.creationTime(),
                this.spCoinContractDeployed.decimals(),
                this.spCoinContractDeployed.totalSupply(),
                this.spCoinContractDeployed.initialTotalSupply(),
                readAnnualInflation(this.spCoinContractDeployed),
                this.spCoinContractDeployed.totalBalanceOf(),
                this.spCoinContractDeployed.totalStakingRewards(),
                this.spCoinContractDeployed.totalStakedSPCoins(),
                this.spCoinContractDeployed.symbol(),
                versionReader(),
            ]);
            let headerData = [
                "NAME:" + String(name),
                "CREATION_TIME:" + String(creationTime),
                "DECIMALS:" + String(decimals),
                "TOTAL_SUPPLY:" + String(totalSupply),
                "INITIAL_TOTAL_SUPPLY:" + String(initialTotalSupply),
                "ANNUAL_INFLATION:" + String(annualInflation),
                "TOTAL_BALANCE_OF:" + String(totalBalanceOf),
                "TOTAL_STAKED_REWARDS:" + String(totalStakingRewards),
                "TOTAL_STAKED_SP_COINS:" + String(totalStakedSPCoins),
                "SYMBOL:" + String(symbol),
                "VERSION:" + String(version),
            ].join(",");
            let elements = headerData.split(",");
            // console.log("headerData", headerData);
            // console.log("elements.length", elements.length);
            for (let i = 0; i < elements.length; i++) {
                let element = elements[i].trim();
                let keyValue = element.split(":");
                spCoinLogger.logDetail("JS => keyValue = " + keyValue);
                // console.log("JS => keyValue = " + keyValue);
                let key = keyValue[0].trim();
                let value = keyValue[1].trim();
                spCoinLogger.logDetail("JS => key     = " + key);
                spCoinLogger.logDetail("JS => value   = " + value);
                this.addSPCoinHeaderField(key, value, sponsorCoinHeader);
            }
            return sponsorCoinHeader;
        };
        this.getSerializedRecipientRateList = async (_sponsorKey, _recipientKey, _recipientRateKey) => this.getRecipientRateRecordFields(_sponsorKey, _recipientKey, _recipientRateKey);
        this.getSerializedRecipientRecordList = async (_sponsorKey, _recipientKey) => this.getRecipientRecordFields(_sponsorKey, _recipientKey);
        this.getSerializedAgentRateList = async (_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey) => this.getAgentRateRecordFields(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey);
        this.getSerializedAccountRecord = async (_accountKey) => this.getAccountRecordObject(_accountKey);
        this.getSerializedAccountRewards = async (_accountKey) => this.getAccountRewardsValue(_accountKey);
        this.deserializedSPCoinHeader = async () => this.getSPCoinHeaderObject();
        this.addSPCoinHeaderField = (_key, _value, spCoinHeaderRecord) => {
            // console.log("JS => _key   = " + _key);
            // console.log("JS => _value = " + _value);
            switch (_key.trim()) {
                case "NAME":
                    spCoinHeaderRecord.name = _value;
                    break;
                case "SYMBOL":
                    spCoinHeaderRecord.symbol = _value;
                    break;
                case "DECIMALS":
                    spCoinHeaderRecord.decimals = bigIntToDecString(_value);
                    break;
                case "TOTAL_SUPPLY":
                    spCoinHeaderRecord.totalSupply = bigIntToDecString(_value);
                    break;
                case "TOTAL_BALANCE_OF":
                    spCoinHeaderRecord.totalBalanceOf = bigIntToDecString(_value);
                    break;
                case "INITIAL_TOTAL_SUPPLY":
                    spCoinHeaderRecord.initialTotalSupply = bigIntToDecString(_value);
                    break;
                case "ANNUAL_INFLATION":
                    spCoinHeaderRecord.annualInflation = bigIntToDecString(_value);
                    break;
                case "CREATION_TIME":
                    spCoinHeaderRecord.creationTime = bigIntToDateTimeString(_value);
                    break;
                case "TOTAL_STAKED_SP_COINS":
                    spCoinHeaderRecord.totalStakedSPCoins = bigIntToDecString(_value);
                    break;
                case "TOTAL_STAKED_REWARDS":
                    spCoinHeaderRecord.totalStakingRewards = bigIntToDecString(_value);
                    break;
                case "VERSION":
                    spCoinHeaderRecord.version = _value;
                    break;
                default:
                    break;
            }
        };
        if (_spCoinContractDeployed != undefined) {
            this.spCoinContractDeployed = _spCoinContractDeployed;
            spCoinLogger = new SpCoinLogger(_spCoinContractDeployed);
        }
    }
}
