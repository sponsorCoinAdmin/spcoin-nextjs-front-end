const { SpCoinLogger } = require("../utils/logging");
const {
  RewardAccountStruct,
  AccountStruct,
  AgentRateStruct,
  AgentStruct,
  RecipientStruct,
  RecipientRateStruct,
  RewardRateStruct,
  RewardsStruct,
  RewardTransactionStruct,
  RewardTypeStruct,
  StakingTransactionStruct
} = require("../dataTypes/spCoinDataTypes");

const { SpCoinSerialize, bigIntToDecString, bigIntToDateTimeString, getLocation } = require("../utils//serialize");

const SPONSOR = 0;
const RECIPIENT = 1;
const AGENT = 2;

let spCoinLogger;
let spCoinSerialize;

//////////////////////////// ROOT LEVEL FUNCTIONS ////////////////////////////

class SpCoinReadModule {
  constructor( _spCoinContractDeployed ) {
    this.spCoinContractDeployed = _spCoinContractDeployed;
    spCoinSerialize = new SpCoinSerialize(_spCoinContractDeployed);
    spCoinLogger = new SpCoinLogger(_spCoinContractDeployed);
  }
  
  getAccountList = async () => {
    spCoinLogger.logFunctionHeader("getAccountList = async()");
    let insertedAccountList = await this.spCoinContractDeployed.getAccountList();
    spCoinLogger.logExitFunction();
    return insertedAccountList;
  };
  
  getAccountListSize = async () => {
    spCoinLogger.logFunctionHeader("getAccountListSize = async()");
    let maxSize = (await this.getAccountList()).length;
    spCoinLogger.logDetail("JS => Found " + maxSize + " Account Keys");
    spCoinLogger.logExitFunction();
    return maxSize;
  };
  
  getAccountRecipientList = async (_accountKey) => {
    // console.log("JS==>4 getAccountRecipientList = async(" + _accountKey + ")");
    spCoinLogger.logFunctionHeader("getAccountRecipientList = async(" + _accountKey + ")");
    let recipientAccountList = await this.spCoinContractDeployed.getAccountRecipientList(_accountKey);
    spCoinLogger.logExitFunction();
    return recipientAccountList;
  };
  
  getAccountRecipientListSize = async (_accountKey) => {
    // console.log("JS==>20 getAccountRecipientListSize = async(" + _accountKey + ")");
    spCoinLogger.logFunctionHeader("getAccountRecipientListSize = async(" + _accountKey + ")");
  
    let maxSize = (await this.getAccountRecipientList(_accountKey)).length;
    spCoinLogger.logDetail("JS => Found " + maxSize + " Account Recipient Keys");
    spCoinLogger.logExitFunction();
    return maxSize;
  };

  getAccountRecord = async (_accountKey) => {
    // console.log("JS==>2 getAccountRecord = async(", _accountKey,")");
    let accountStruct                 = await spCoinSerialize.getSerializedAccountRecord(_accountKey);
    accountStruct.accountKey          = _accountKey;
    let recipientAccountList          = await this.getAccountRecipientList(_accountKey);
    accountStruct.recipientRecordList = await this.getRecipientRecordList(_accountKey, recipientAccountList);
    accountStruct.stakingRewardList   = await this.getAccountStakingRewards(_accountKey);
    spCoinLogger.logExitFunction();
    return accountStruct;
  }

  getAccountStakingRewards = async (_accountKey) => {
    // console.log ("JS==>1 ===================================================================================================");
    // console.log("JS==>1.1 getAccountStakingRewards = async(", spCoinLogger.getJSON(_accountKey),")");
    let rewardsRecord = new RewardsStruct();

    let accountRewardsStr = await this.spCoinContractDeployed.getSerializedAccountRewards(_accountKey);
    let accountRewardList = accountRewardsStr.split(",");
    // rewardsRecord.stakingRewards  = bigIntToDecString(accountRewardList[3]);
    /* REPLACE LATER */
    rewardsRecord.sponsorRewardsList   = await this.getRewardTypeRecord(_accountKey, SPONSOR , accountRewardList[0]);
    rewardsRecord.recipientRewardsList = await this.getRewardTypeRecord(_accountKey, RECIPIENT, accountRewardList[1]);
    rewardsRecord.agentRewardsList     = await this.getRewardTypeRecord(_accountKey, AGENT, accountRewardList[2]);

    // console.log("JS==>1.2 accountRewardList(", _accountKey, ") =", spCoinLogger.getJSON(accountRewardList));
    // console.log("JS==>1.3 rewardsRecord.agentRewardsList(", _accountKey, ", SPONSOR) =", spCoinLogger.getJSON(rewardsRecord));
    spCoinLogger.logExitFunction();
    // console.log ("===================================================================================================\n\n");

    return rewardsRecord;
  }

  getRewardTypeRecord = async (_accountKey, _rewardType, _reward) => {
    // console.log("JS==>6 getRewardTransactionsByAccountList = async(", _accountKey, ", ", getRewardType(_rewardType), ", ", _reward,")");
    let rewardTypeRecord = new RewardTypeStruct();
    rewardTypeRecord.TYPE = getRewardType(_rewardType);
    rewardTypeRecord.stakingRewards = bigIntToDecString(_reward);

    let rewardAccountList;
    let rewardsStr = "";

    rewardsStr = await this.spCoinContractDeployed.getRewardAccounts(_accountKey, _rewardType);
    // console.log ("JS==>6.1 rewardsStr.length = ", rewardsStr.length);

    // console.log ("JS==>6.2 rewardsStr = ", rewardsStr);
    if (rewardsStr.length > 0) {
      // console.log ("JS==>6.3 getSourceTypeDelimiter(_rewardType) = ", getSourceTypeDelimiter(_rewardType));
      rewardAccountList = rewardsStr.split(getSourceTypeDelimiter(_rewardType));
      rewardTypeRecord.rewardAccountList =  this.getAccountRewardTransactionList(rewardAccountList);
    }
    else
      rewardAccountList = [];

    // console.log ("JS==>6.4 rewardsStr = ", spCoinLogger.getJSON(rewardsStr));
    // console.log ("JS==>6.5 rewardAccountList(" + getRewardType(_rewardType) + ").length = ", rewardAccountList.length);
    // console.log ("JS==>6.6 rewardAccountList(" + getRewardType(_rewardType) + ") = ", rewardAccountList);
    // spCoinLogger.logJSON(rewardTypeRecord);
    spCoinLogger.logExitFunction();
    return rewardTypeRecord;
  }

  getAccountRewardTransactionList = (_rewardAccountList) => {
    // console.log("JS==>5 getAccountRewardTransactionList = (_rewardAccountList = ", _rewardAccountList,")");

    let rewardTransactionsByAccountList = [];
    for (var idx = _rewardAccountList.length - 1; idx >= 1; idx--) {
      let rewardAccountRecord = this.getAccountRewardTransactionRecord(_rewardAccountList[idx]);
      rewardTransactionsByAccountList.push(rewardAccountRecord);
    }
    // spCoinLogger.logJSON(rewardTransactionsByAccountList);
    spCoinLogger.logExitFunction();
    return rewardTransactionsByAccountList;
  }

  getAccountRewardTransactionRecord = (_rewardRecordStr) => {
    let rateRewardList = _rewardRecordStr.split("\nRATE:");

    // console.log ("rateRewardList.length = ",rateRewardList.length);
    // console.log ("JS=>2.0 BEFORE rateRewardList = ",rateRewardList);

    let rewardAccountRecord;
    if(rateRewardList.length > 0) {
      rewardAccountRecord = new RewardAccountStruct();
      let rewardRecordFields = rateRewardList.shift().split(",");
      // console.log ("JS=>2.1 AFTER rateRewardList = ",rateRewardList);
      if(rateRewardList.length > 0) {
        rewardAccountRecord.sourceKey = rewardRecordFields[0];
        rewardAccountRecord.stakingRewards = bigIntToDecString(rewardRecordFields[1]);
        rewardAccountRecord.rateList = this.getAccountRateRecordList(rateRewardList);
      }
    }
    spCoinLogger.logExitFunction();
    return rewardAccountRecord;
    }

  // GOOD TO HERE

  getAccountRateRecordList = ( rateRewardList ) => {
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
      rewardRateRecord.rate = bigIntToDecString( rateRewardHeaderFields[0] );
      rewardRateRecord.stakingRewards = bigIntToDecString( rateRewardHeaderFields[1] );
      // console.log ("JS=>3.5 AFTER rateRewardTransactions.length = ", rateRewardTransactions.length);
      // console.log ("JS=>3.6 AFTER rateRewardTransactions = ", rateRewardTransactions);
      rewardRateRecord.rewardTransactionList = this.getRateTransactionList(rateRewardTransactions);
      rateList.push(rewardRateRecord);
    }
    spCoinLogger.logExitFunction();
    return  rateList;
  }

  getRateTransactionList = (rewardRateRowList) => {
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
    return  rateTransactionList;
  }

  getSPCoinHeaderRecord = async(getBody) => {
    // console.log("JS==>1 getAccountRecords()");
    spCoinLogger.logFunctionHeader("getAccountRecords()");
    let sponsorCoinHeader = await spCoinSerialize.deserializedSPCoinHeader();
    sponsorCoinHeader.location = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (getBody)
      sponsorCoinHeader.accountRecords = await this.getAccountRecords()
    return sponsorCoinHeader;
  }

  getAccountRecords = async() => {
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
  }
  
  //////////////////// LOAD AGENT _rewardTransactionList DATA //////////////////////
  
  getAgentRateList = async (_sponsorKey, _recipientKey, _recipientRateKey, _agentKey) => {
    // console.log("JS==>17 getAgentRateList = async(" + _sponsorKey + ", " + _recipientKey + ", " + _recipientRateKey + ", " + _agentKey + ")" );
    spCoinLogger.logFunctionHeader("getAgentRateList = async(" + _sponsorKey + ", " + _recipientKey + ", " + _recipientRateKey + ", " + _agentKey + ")" );
    let networkRateKeys = await this.spCoinContractDeployed.getAgentRateList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey);
    let agentRateList = [];
    for (let [idx, netWorkRateKey] of Object.entries(networkRateKeys)) {
      // agentRateList.push(netWorkRateKey.toNumber());
      agentRateList.push(netWorkRateKey);
    }
    spCoinLogger.logExitFunction();
    return agentRateList;
  };

  getAgentRateRecord = async(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey) => {
    // console.log("JS==>18.0 getAgentRateRecord(\n   _sponsorKey = " + _sponsorKey + ",\n   _recipientKey = " + _recipientKey + ",\n   _agentKey = " + _agentKey+ ",\n   _agentRateKey = " + _agentRateKey + ")");
    spCoinLogger.logFunctionHeader("getAgentRateRecord(" + _sponsorKey + ", " + _recipientKey + ", " + _agentKey+ ", " + _agentRateKey + ")");
    let agentRateRecord = new AgentRateStruct();
    let recordStr = await spCoinSerialize.getSerializedAgentRateList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey);
    agentRateRecord.agentRate = _agentRateKey;
    // console.log("JS==>18.1 agentRateRecord.agentRate = ", agentRateRecord.agentRate);
    agentRateRecord.creationTime = bigIntToDateTimeString(recordStr[0]);
    agentRateRecord.lastUpdateTime = bigIntToDateTimeString(recordStr[1]);
    // console.log("JS==>18.2 agentRateRecord.lastUpdateTime = ", bigIntToDecString(recordStr[1]));
    // console.log("JS==>18.3 agentRateRecord.lastUpdateTime = ", agentRateRecord.lastUpdateTime);
    // console.log()
    agentRateRecord.stakedSPCoins = bigIntToDecString(recordStr[2]);
    // console.log("JS==>18.4 agentRateRecord.stakedSPCoins = ", agentRateRecord.stakedSPCoins);
    agentRateRecord.transactions = await this.getAgentRateTransactionList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey);
    spCoinLogger.logExitFunction();
    return agentRateRecord;
  }

  getAgentRateRecordList = async(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey) => {
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
  }
  
  //////////////////// LOAD AGENT TRANSACTION DATA //////////////////////

  getAgentRecord = async(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey) => {
    // console.log("JS==>15 getAgentRecord = async(" + ", " + _sponsorKey + ", " + _recipientKey + ", " + _recipientRateKey + ", " + _agentKey + ")");
    spCoinLogger.logFunctionHeader("getAgentRecord = async(" + ", " + _sponsorKey + ", " + _recipientKey + ", " + _recipientRateKey + ", " + _agentKey + ")");
    let agentRecord = new AgentStruct();
    agentRecord.agentKey = _agentKey;
    agentRecord.stakedSPCoins = bigIntToDecString(await this.spCoinContractDeployed.getAgentTotalRecipient(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey));
    agentRecord.agentRateList = await this.getAgentRateRecordList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey);
    spCoinLogger.logExitFunction();
    return agentRecord;
  }
  
  getAgentRecordList = async(_sponsorKey, _recipientKey, _recipientRateKey, _agentAccountList) => {
    // console.log("JS==>14 getAgentRecordList = async("+_sponsorKey, + ", " + _recipientKey + ", " + _recipientRateKey + ")");
    spCoinLogger.logFunctionHeader("getAgentRecordList = async("+_sponsorKey, + ", " + _recipientKey + ", " + _recipientRateKey + ")");
    let agentRecordList = [];
    for (let [idx, agentKey] of Object.entries(_agentAccountList)) {
    let agentRecord = await this.getAgentRecord(_sponsorKey, _recipientKey, _recipientRateKey, agentKey);
      agentRecordList.push(agentRecord);
    }
    spCoinLogger.logExitFunction();
    return agentRecordList;
  }
  
  getAgentRateTransactionList = async(_sponsorCoin, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey) => {
    // console.log("JS==>18.0 getAgentRateTransactionList = async(" + _recipientKey + ", " + _recipientRateKey + ", " + _agentKey + ", " + _agentRateKey + ")");
    spCoinLogger.logFunctionHeader("getAgentRateTransactionList = async(" + _recipientKey + ", " + _recipientRateKey + ", " + _agentKey + ", " + _agentRateKey + ")");
    let agentRateTransactionList = await this.spCoinContractDeployed.getSerializedRateTransactionList(_sponsorCoin, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey);
    spCoinLogger.logExitFunction();
    return spCoinSerialize.deserializeRateTransactionRecords(agentRateTransactionList);
  }  

  /////////////////////// RECIPIENT RECORD FUNCTIONS ///////////////////////

  getRecipientRateAgentList = async (_sponsorKey, _recipientKey, _recipientRateKey) => {
    // console.log("JS==>13 getRecipientRateAgentList = async(" + _sponsorKey + ", " + _recipientKey + ", " + _recipientRateKey + ")" );
    spCoinLogger.logFunctionHeader("getRecipientRateAgentList = async(" + _sponsorKey + ", " + _recipientKey + ", " + _recipientRateKey + ")" );
    let agentAccountList = await this.spCoinContractDeployed.getRecipientRateAgentList(_sponsorKey, _recipientKey, _recipientRateKey);
    spCoinLogger.logExitFunction();
    return agentAccountList;
  };

  getRecipientRateRecord = async(_sponsorKey, _recipientKey, _recipientRateKey) => {
    // console.log("JS==>10.0 getRecipientRateRecord(" + _sponsorKey + ", " + _recipientKey + ", " + _recipientRateKey + ")");
    spCoinLogger.logFunctionHeader("getRecipientRateRecord(" + _sponsorKey  + _recipientKey + ", " + _recipientRateKey + ")");
    let recipientRateRecord = new RecipientRateStruct();
    let recordStr = await spCoinSerialize.getSerializedRecipientRateList(_sponsorKey, _recipientKey, _recipientRateKey);
    // console.log("JS==>10.1 getRecipientRateRecord: recordStr = ", recordStr);
    let agentAccountList = await this.getRecipientRateAgentList(_sponsorKey, _recipientKey, _recipientRateKey);
    // console.log("JS==>10.2 getRecipientRateRecord: agentAccountList = ", agentAccountList);
    recipientRateRecord.recipientRate  = _recipientRateKey;
    recipientRateRecord.creationTime  = bigIntToDateTimeString(recordStr[0]);
    recipientRateRecord.lastUpdateTime   = bigIntToDateTimeString(recordStr[1]);
    recipientRateRecord.stakedSPCoins  = bigIntToDecString(recordStr[2]);
    recipientRateRecord.transactions   = await this.getRecipientRateTransactionList(_sponsorKey, _recipientKey, _recipientRateKey);
    recipientRateRecord.agentRecordList  = await this.getAgentRecordList(_sponsorKey, _recipientKey, _recipientRateKey, agentAccountList);
    spCoinLogger.logExitFunction();
    return recipientRateRecord;
  }

  getRecipientRateRecordList = async(_sponsorKey, _recipientKey) => {
    // console.log("JS==>8 getRecipientRateRecordList = async(" + _sponsorKey +","  + _recipientKey + ")");
    spCoinLogger.logFunctionHeader("getRecipientRateRecordList = async(" + _sponsorKey +","  + _recipientKey + ")");
    let networkRateList = await this.getRecipientRateList(_sponsorKey, _recipientKey);
    let recipientRateRecordList = [];
    
    for (let [idx, recipientRateKey] of Object.entries(networkRateList)) {
    //log("JS => Loading Recipient Rates " + recipientRateKey + " idx = " + idx);
    let recipientRateRecord = await this.getRecipientRateRecord(_sponsorKey, _recipientKey, recipientRateKey);
    recipientRateRecordList.push(recipientRateRecord);
    }
    spCoinLogger.logExitFunction();
    return recipientRateRecordList;
  }
  
  getRecipientRecord = async(_sponsorKey, _recipientKey) => {
    // console.log("JS==>6 getRecipientRecord = async(" + _sponsorKey + ", ", + _recipientKey + ")");
    spCoinLogger.logFunctionHeader("getRecipientRecord = async(" +_sponsorKey, + ",", + _recipientKey + ")");
    let recipientRecord = new RecipientStruct(_recipientKey);
    recipientRecord.recipientKey = _recipientKey;
    
    let recordStr = await spCoinSerialize.getSerializedRecipientRecordList(_sponsorKey, _recipientKey);
    recipientRecord.creationTime = bigIntToDateTimeString(recordStr[0]);
    recipientRecord.stakedSPCoins = bigIntToDecString(recordStr[1]);
    
    // ToDo New Robin
    recipientRecord.recipientRateList = await this.getRecipientRateRecordList(_sponsorKey, _recipientKey);
    spCoinLogger.logExitFunction();
    return recipientRecord;
  }

  getRecipientRecordList = async(_sponsorKey, _recipientAccountList) => {
    // console.log("JS==>5 getRecipientRecordList = async(" +_sponsorKey + ","+ _recipientAccountList + ")");
    spCoinLogger.logFunctionHeader("getRecipientRecordList = async(" +_sponsorKey + ","+ _recipientAccountList + ")");
    let recipientRecordList = [];
    for (let [idx, recipientKey] of Object.entries(_recipientAccountList)) {
    spCoinLogger.logDetail("JS => Loading Recipient Record " + recipientKey, idx);
    let recipientRecord = await this.getRecipientRecord(_sponsorKey, recipientKey);
    recipientRecordList.push(recipientRecord);
    }
    spCoinLogger.logExitFunction();
    return recipientRecordList;
  }
  
  getRecipientRateList = async(_sponsorKey, _recipientKey) => {
    spCoinLogger.logFunctionHeader("getRecipientRateList = async(" + _sponsorKey +","  + _recipientKey + ")");
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
  }
    
  getRecipientRateTransactionList = async(_sponsorCoin, _recipientKey, _recipientRateKey) => {
    // console.log("JS==>18 getRecipientRateTransactionList = async(" + _recipientKey + ", " + _recipientRateKey + ")");
    spCoinLogger.logFunctionHeader("getRecipientRateTransactionList = async(" + _recipientKey + ", " + _recipientRateKey + ")");
    let agentRateTransactionList = await this.spCoinContractDeployed.getRecipientRateTransactionList(_sponsorCoin, _recipientKey, _recipientRateKey);
    spCoinLogger.logExitFunction();
    return spCoinSerialize.deserializeRateTransactionRecords(agentRateTransactionList);
  }
}

const getRewardType = (_accountType) => {
  return getAccountTypeString(_accountType) + " REWARDS"; 
}

const getAccountTypeString = (_accountType) => {
  let strAccountType = "";
  if (_accountType == SPONSOR)
      return "SPONSOR";
  else
  if (_accountType == RECIPIENT)
      return "RECIPIENT";
  else
  if (_accountType == AGENT)
      return "AGENT";
  return strAccountType; 
}

const getSourceTypeDelimiter = (_accountType) => {
  if (_accountType == SPONSOR)
      return "RECIPIENT_ACCOUNT:";
  else
  if (_accountType == RECIPIENT)
      return "SPONSOR_ACCOUNT:";
  else
  if (_accountType == AGENT)
      return "RECIPIENT_ACCOUNT:";
}

/////////////////////// EXPORT MODULE FUNCTIONS ///////////////////////

module.exports = {
  SpCoinReadModule,
};
