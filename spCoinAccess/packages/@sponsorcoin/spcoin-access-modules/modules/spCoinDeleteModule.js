const { SpCoinLogger } = require("../utils/logging");

let spCoinLogger;

class SpCoinDeleteModule {

  constructor(_spCoinContractDeployed) {
    this.spCoinContractDeployed = _spCoinContractDeployed;
    spCoinLogger = new SpCoinLogger(_spCoinContractDeployed)
    this.setSigner(_spCoinContractDeployed.signer);
  }

  setSigner(_signer) {
    this.signer = _signer;
  }

  deleteAccountRecord = async (_accountKey) => {
    // ToDo: do Solidity Code and Testing
      spCoinLogger.logFunctionHeader("deleteAccountRecord = async(" + _accountKey + ")");
      spCoinLogger.logDetail("JS => Deleting Account " + _accountKey + " From Blockchain Network");
      await this.spCoinContractDeployed.connect(this.signer).deleteAccountRecord(_accountKey);
      spCoinLogger.logExitFunction();
  };

  deleteAccountRecords = async (_accountListKeys) => {
    spCoinLogger.logFunctionHeader("deleteAccountRecords = async(arrayAccounts)");
    let maxCount = _accountListKeys.length;
    spCoinLogger.logDetail("JS => Inserting " + maxCount + " Records to Blockchain Network");
    
    for (idx = 0; idx < maxCount; idx++) {
      let accountKey = _accountListKeys[idx];
      spCoinLogger.logDetail("JS => Deleting " + idx + ", " + accountKey);
      await deleteAccountRecord(accountKey);
    }
    spCoinLogger.logDetail("JS => Inserted " + maxCount + " Account to Blockchain Network");
    spCoinLogger.logExitFunction();
  };

  /////////////////////// RECIPIENT RECORD FUNCTIONS ///////////////////////

  unSponsorRecipient = async (_sponsorKey, _recipientKey) => {
    spCoinLogger.logFunctionHeader("unSponsorRecipient(" + _sponsorKey.accountKey + ", " + _recipientKey + ")");
    await this.spCoinContractDeployed.connect(this.signer).unSponsorRecipient(_recipientKey);
    spCoinLogger.logExitFunction();
  }

  /////////////////////// AGENT RECORD FUNCTIONS ////////////////////////

  deleteAgentRecord = async (_accountKey, _recipientKey, _accountAgentKey) => {
    // ToDo: do Solidity Code and Testing
    spCoinLogger.logFunctionHeader(
      "deleteAgentRecord = async(" + _accountKey + ", " + _recipientKey + ", " + _accountAgentKey + ")"
    );
    spCoinLogger.logDetail("JS => For Account[" + _accountKey + "]: " + _accountKey + ")");
    spCoinLogger.logDetail("JS => Deleting Agent " + _accountAgentKey + " From Blockchain Network");

    spCoinLogger.logDetail("JS =>  " + _accountKey + ". " + "Inserting Agent[" + _accountKey + "]: " + _accountAgentKey );
    // await this.spCoinContractDeployed.connect(this.signer).deleteAgentRecord( _accountKey, _recipientKey, _agentKey );
    spCoinLogger.logDetail("JS => "+ "Deleted = " + _accountAgentKey + " Agent Record from RecipientKey " + _recipientKey);
    spCoinLogger.logExitFunction();
  };
};

/////////////////////// EXPORT MODULE FUNCTIONS ///////////////////////

module.exports = {
  SpCoinDeleteModule
};
