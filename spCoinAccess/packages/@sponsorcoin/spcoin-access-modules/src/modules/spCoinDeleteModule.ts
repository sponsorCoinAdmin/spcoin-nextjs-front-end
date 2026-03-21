// @ts-nocheck
// File: /@sponsorcoin/spcoin-access-modules/modules/spCoinDeleteModule.js
import type { ContractTransactionResponse, Signer } from "ethers";
const { SpCoinLogger } = require("../utils/logging");
let spCoinLogger;
export class SpCoinDeleteModule {
    spCoinContractDeployed: any;
    signer?: Signer;
    deleteAccountRecord: (_accountKey: string) => Promise<ContractTransactionResponse>;
    deleteAccountRecords: (_accountListKeys: string[]) => Promise<number>;
    unSponsorRecipient: (_sponsorKey: { accountKey: string }, _recipientKey: string) => Promise<ContractTransactionResponse>;
    deleteAgentRecord: (_accountKey: string, _recipientKey: string, _accountAgentKey: string) => Promise<void>;

    constructor(_spCoinContractDeployed) {
        this.deleteAccountRecord = async (_accountKey) => {
            // ToDo: do Solidity Code and Testing
            spCoinLogger.logFunctionHeader("deleteAccountRecord = async(" + _accountKey + ")");
            spCoinLogger.logDetail("JS => Deleting Account " + _accountKey + " From Blockchain Network");
            const tx = await this.spCoinContractDeployed.connect(this.signer).deleteAccountRecord(_accountKey);
            spCoinLogger.logExitFunction();
            return tx;
        };
        this.deleteAccountRecords = async (_accountListKeys) => {
            spCoinLogger.logFunctionHeader("deleteAccountRecords = async(arrayAccounts)");
            let maxCount = _accountListKeys.length;
            spCoinLogger.logDetail("JS => Inserting " + maxCount + " Records to Blockchain Network");
            for (let idx = 0; idx < maxCount; idx++) {
                let accountKey = _accountListKeys[idx];
                spCoinLogger.logDetail("JS => Deleting " + idx + ", " + accountKey);
                await this.deleteAccountRecord(accountKey);
            }
            spCoinLogger.logDetail("JS => Inserted " + maxCount + " Account to Blockchain Network");
            spCoinLogger.logExitFunction();
            return maxCount;
        };
        /////////////////////// RECIPIENT RECORD FUNCTIONS ///////////////////////
        this.unSponsorRecipient = async (_sponsorKey, _recipientKey) => {
            spCoinLogger.logFunctionHeader("unSponsorRecipient(" + _sponsorKey.accountKey + ", " + _recipientKey + ")");
            const tx = await this.spCoinContractDeployed.connect(this.signer).unSponsorRecipient(_recipientKey);
            spCoinLogger.logExitFunction();
            return tx;
        };
        /////////////////////// AGENT RECORD FUNCTIONS ////////////////////////
        this.deleteAgentRecord = async (_accountKey, _recipientKey, _accountAgentKey) => {
            // ToDo: do Solidity Code and Testing
            spCoinLogger.logFunctionHeader("deleteAgentRecord = async(" + _accountKey + ", " + _recipientKey + ", " + _accountAgentKey + ")");
            spCoinLogger.logDetail("JS => For Account[" + _accountKey + "]: " + _accountKey + ")");
            spCoinLogger.logDetail("JS => Deleting Agent " + _accountAgentKey + " From Blockchain Network");
            spCoinLogger.logDetail("JS =>  " + _accountKey + ". " + "Inserting Agent[" + _accountKey + "]: " + _accountAgentKey);
            // await this.spCoinContractDeployed.connect(this.signer).deleteAgentRecord( _accountKey, _recipientKey, _agentKey );
            spCoinLogger.logDetail("JS => " + "Deleted = " + _accountAgentKey + " Agent Record from RecipientKey " + _recipientKey);
            spCoinLogger.logExitFunction();
        };
        this.spCoinContractDeployed = _spCoinContractDeployed;
        spCoinLogger = new SpCoinLogger(_spCoinContractDeployed);
    }
}


