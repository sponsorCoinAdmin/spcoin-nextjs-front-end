// @ts-nocheck
// File: /@sponsorcoin/spcoin-access-modules/modules/spCoinAddModule.js
import type { ContractTransactionResponse, Signer } from "ethers";
const { SpCoinLogger } = require("../utils/logging");
let spCoinLogger;
const BURN_ADDRESS = "0x0000000000000000000000000000000000000000";
export class SpCoinAddModule {
    spCoinContractDeployed: any;
    addRecipient: (_recipientKey: string) => Promise<ContractTransactionResponse>;
    addRecipients: (_accountKey: string, _recipientAccountList: string[]) => Promise<number>;
    addAgent: (_recipientKey: string, _recipientRateKey: string | number, _accountAgentKey: string) => Promise<ContractTransactionResponse>;
    addAgents: (_recipientKey: string, _recipientRateKey: string | number, _agentAccountList: string[]) => Promise<number>;
    addAccountRecord: (_accountKey: string) => Promise<ContractTransactionResponse>;
    addAccountRecords: (_accountListKeys: string[]) => Promise<number>;
    addSponsorship: (
        _sponsorSigner: Signer,
        _recipientKey: string,
        _recipientRateKey: string | number,
        _transactionQty: string | number
    ) => Promise<ContractTransactionResponse>;
    addAgentSponsorship: (
        _sponsorSigner: Signer,
        _recipientKey: string,
        _recipientRateKey: string | number,
        _accountAgentKey: string,
        _agentRateKey: string | number,
        _transactionQty: string | number
    ) => Promise<ContractTransactionResponse>;
    addBackDatedSponsorship: (
        _sponsorSigner: Signer,
        _recipientKey: string,
        _recipientRateKey: string | number,
        _transactionQty: string | number,
        _transactionBackDate: number
    ) => Promise<ContractTransactionResponse>;
    addBackDatedAgentSponsorship: (
        _sponsorSigner: Signer,
        _recipientKey: string,
        _recipientRateKey: string | number,
        _accountAgentKey: string,
        _agentRateKey: string | number,
        _transactionQty: string | number,
        _transactionBackDate: number
    ) => Promise<ContractTransactionResponse>;

    constructor(_spCoinContractDeployed) {
        this.addRecipient = async (_recipientKey) => {
            spCoinLogger.logFunctionHeader("addRecipient = async(" + _recipientKey + ")");
            spCoinLogger.logDetail("JS => Inserting " + _recipientKey + " Recipient To Blockchain Network");
            spCoinLogger.logDetail("JS => Inserting Recipient " + _recipientKey);
            const tx = await this.spCoinContractDeployed.addRecipient(_recipientKey);
            spCoinLogger.logExitFunction();
            return tx;
        };
        this.addRecipients = async (_accountKey, _recipientAccountList) => {
            spCoinLogger.logFunctionHeader("addRecipients = async(" + _accountKey + ", " + _recipientAccountList + ")");
            spCoinLogger.logDetail("JS => For Account[" + _accountKey + "]: " + _accountKey + ")");
            spCoinLogger.logDetail("JS => Adding " + _recipientAccountList.length + " Recipient To Blockchain Network");
            let recipientCount = 0;
            for (recipientCount; recipientCount < _recipientAccountList.length; recipientCount++) {
                let _recipientKey = _recipientAccountList[recipientCount];
                await this.addRecipient(_recipientKey);
            }
            spCoinLogger.logDetail("JS => Inserted = " + recipientCount + " Recipient Records");
            spCoinLogger.logExitFunction();
            return recipientCount;
        };
        this.addAgent = async (_recipientKey, _recipientRateKey, _accountAgentKey) => {
            spCoinLogger.logFunctionHeader("addAgent = async(" + _recipientKey + ", " + _recipientRateKey + ", " + _accountAgentKey + ")");
            spCoinLogger.logDetail("JS => Adding Agent " + _accountAgentKey + " To Blockchain Network");
            spCoinLogger.logDetail("JS =>  " + "Inserting Agent[" + _recipientKey + "]: " + _accountAgentKey);
            const tx = await this.spCoinContractDeployed.addAgent(_recipientKey, _recipientRateKey, _accountAgentKey);
            spCoinLogger.logDetail("JS => " + "Added Agent " + _accountAgentKey + " Record to RecipientKey " + _recipientKey);
            spCoinLogger.logExitFunction();
            return tx;
        };
        this.addAgents = async (_recipientKey, _recipientRateKey, _agentAccountList) => {
            spCoinLogger.logFunctionHeader("addAgents = async(" + _recipientKey + ", " + _recipientRateKey + ", " + _agentAccountList + ")");
            spCoinLogger.logDetail("JS => For Recipient[" + _recipientKey + "]: " + _recipientKey + ")");
            spCoinLogger.logDetail("JS => Inserting " + _agentAccountList.length + " Agent To Blockchain Network");
            spCoinLogger.logDetail("JS => _agentAccountList = " + _agentAccountList);
            let agentSize = _agentAccountList.length;
            spCoinLogger.logDetail("JS => agentSize.length = " + agentSize);
            let agentCount = 0;
            for (agentCount = 0; agentCount < agentSize; agentCount++) {
                let agentKey = _agentAccountList[agentCount];
                spCoinLogger.logDetail("JS =>  " + agentCount + ". " + "Inserting Agent[" + agentCount + "]: " + agentKey);
                await this.addAgent(_recipientKey, _recipientRateKey, agentKey);
            }
            spCoinLogger.logDetail("JS => " + "Inserted = " + agentSize + " Agent Records");
            spCoinLogger.logExitFunction();
            return agentCount;
        };
        this.addAccountRecord = async (_accountKey) => {
            spCoinLogger.logFunctionHeader("addAccountRecord = async(" + _accountKey + ")");
            spCoinLogger.logDetail("JS => Inserting Account " + _accountKey + " To Blockchain Network");
            await this.spCoinContractDeployed.addAccountRecord(_accountKey);
            spCoinLogger.logExitFunction();
        };
        this.addAccountRecords = async (_accountListKeys) => {
            spCoinLogger.logFunctionHeader("addAccountRecord = async(arrayAccounts)");
            let maxCount = _accountListKeys.length;
            spCoinLogger.logDetail("JS => Inserting " + maxCount + " Records to Blockchain Network");
            for (let idx = 0; idx < maxCount; idx++) {
                let account = _accountListKeys[idx];
                spCoinLogger.logDetail("JS => Inserting " + idx + ", " + account);
                await this.spCoinContractDeployed.addAccountRecord(account);
            }
            spCoinLogger.logDetail("JS => Inserted " + maxCount + " Account to Blockchain Network");
            spCoinLogger.logExitFunction();
            return maxCount;
        };
        //////////////////// ADD TRANSACTIONS METHODS //////////////////////
        this.addSponsorship = async (_sponsorSigner, _recipientKey, _recipientRateKey, _transactionQty) => {
            spCoinLogger.logFunctionHeader("addSponsorship = async(" +
                _sponsorSigner + ", " +
                _recipientKey + ", " +
                _recipientRateKey + ", " +
                _transactionQty + ")");
            await this.addAgentSponsorship(_sponsorSigner, _recipientKey, _recipientRateKey, BURN_ADDRESS, 0, _transactionQty);
            spCoinLogger.logExitFunction();
        };
        this.addAgentSponsorship = async (_sponsorSigner, _recipientKey, _recipientRateKey, _accountAgentKey, _agentRateKey, _transactionQty) => {
            spCoinLogger.logFunctionHeader("addAgentSponsorship = async(" +
                _sponsorSigner + ", " +
                _recipientKey + ", " +
                _recipientRateKey + ", " +
                _accountAgentKey + ", " +
                _agentRateKey + ", " +
                _transactionQty + ")");
            let components = _transactionQty.toString().split(".");
            let wholePart = components[0].length > 0 ? components[0] : "0";
            let fractionalPart = components.length > 1 ? components[1] : "0";
            const tx = await this.spCoinContractDeployed.connect(_sponsorSigner).addSponsorship(_recipientKey, _recipientRateKey, _accountAgentKey, _agentRateKey, wholePart, fractionalPart);
            spCoinLogger.logExitFunction();
            return tx;
        };
        this.addBackDatedSponsorship = async (_sponsorSigner, _recipientKey, _recipientRateKey, _transactionQty, _transactionBackDate) => {
            console.log("addBackDatedSponsorship = async(" +
                _sponsorSigner + ", " +
                _recipientKey + ", " +
                _recipientRateKey + ", " +
                _transactionQty + ", " +
                _transactionBackDate + ")");
            await this.addBackDatedAgentSponsorship(_sponsorSigner, _recipientKey, _recipientRateKey, BURN_ADDRESS, 0, _transactionQty, _transactionBackDate);
            spCoinLogger.logExitFunction();
        };
        this.addBackDatedAgentSponsorship = async (_sponsorSigner, _recipientKey, _recipientRateKey, _accountAgentKey, _agentRateKey, _transactionQty, _transactionBackDate) => {
            spCoinLogger.logFunctionHeader("addBackDatedAgentSponsorship = async(" +
                _sponsorSigner + ", " +
                _recipientKey + ", " +
                _recipientRateKey + ", " +
                _accountAgentKey + ", " +
                _agentRateKey + ", " +
                _transactionQty + ", " +
                _transactionBackDate + ")");
            _transactionBackDate = Math.trunc(_transactionBackDate);
            let components = _transactionQty.toString().split(".");
            let wholePart = components[0].length > 0 ? components[0] : "0";
            let fractionalPart = components.length > 1 ? components[1] : "0";
            const tx = await this.spCoinContractDeployed.connect(_sponsorSigner).addBackDatedSponsorship(_recipientKey, _recipientRateKey, _accountAgentKey, _agentRateKey, wholePart, fractionalPart, _transactionBackDate);
            spCoinLogger.logExitFunction();
            return tx;
        };
        this.spCoinContractDeployed = _spCoinContractDeployed;
        spCoinLogger = new SpCoinLogger(_spCoinContractDeployed);
    }
}


