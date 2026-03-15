// const {  spCoinContractDeployed } = require("../contracts/spCoin");
// const { BigNumber, ethers, utils } = require("ethers");
const { SpCoinLogger } = require("./logging");
const { formatTimeSeconds } = require("./dateTime");
const { bigIntToDateTimeString,
        bigIntToDecString,
        bigIntToHexString,
        bigIntToString,
        getLocation
      } = require("./dateTime");
const {
  SponsorCoinHeader,
  AccountStruct,
  RecipientStruct,
  AgentStruct,
  AgentRateStruct,
  StakingTransactionStruct,
} = require("../dataTypes/spCoinDataTypes");

let spCoinLogger;

class SpCoinSerialize {
  constructor( _spCoinContractDeployed) {
    if ( _spCoinContractDeployed != undefined) {
      this.spCoinContractDeployed = _spCoinContractDeployed;
      spCoinLogger = new SpCoinLogger(_spCoinContractDeployed);
      this.setSigner(_spCoinContractDeployed.signer);
    }
  }

  setSigner = (_signer) => {
    this.signer = _signer;
  }

  setContract = ( _spCoinContractDeployed ) => {
    this.spCoinContractDeployed = _spCoinContractDeployed;
    this.signer = _spCoinContractDeployed.signer;
  };

  deSerializedAccountRec = async ( _serializedAccountRec ) => {
    // LOG_DETAIL = true;
    spCoinLogger.logFunctionHeader(
      "deSerializedAccountRec = async(" + _serializedAccountRec + ")"
    );
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

  addAccountField = ( _key, _value, accountRecord ) => {
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

  parseAddressStrRecord = ( strRecord ) => {
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

  getSerializedRecipientRateList = async (_sponsorKey, _recipientKey, _recipientRateKey ) => {
    // console.log("==>11 getSerializedRecipientRecordList = async(" + _sponsorKey + ", " + _recipientKey + ", "+ _recipientRateKey + ", " + ")");
    spCoinLogger.logFunctionHeader("getSerializedRecipientRateList = async(" + _sponsorKey + _recipientKey + ", " + _recipientRateKey + ")");
      let recipientRateRecordStr = await this.spCoinContractDeployed.connect(this.signer).getSerializedRecipientRateList(_sponsorKey, _recipientKey, _recipientRateKey);
    let recipientRateList = recipientRateRecordStr.split(",");
    spCoinLogger.logExitFunction();
    return recipientRateList;
  }

  getSerializedRecipientRecordList = async(_sponsorKey, _recipientKey) => {
    // console.log("==>7 getSerializedRecipientRecordList = async(" + _sponsorKey + ", " + _recipientKey+ ", " + ")");
    spCoinLogger.logFunctionHeader("getSerializedRecipientRecordList = async(" + _sponsorKey + ", " + _recipientKey+ ", " + ")");
    let recipientRecordStr = await this.spCoinContractDeployed.connect(this.signer).getSerializedRecipientRecordList(_sponsorKey, _recipientKey);
    let recipientRecordList = recipientRecordStr.split(",");
    spCoinLogger.logExitFunction();
    return recipientRecordList;
  }

  getSerializedAgentRateList = async(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey) => {
    // console.log("==>19 getSerializedAgentRateList = async(", _recipientKey, _recipientRateKey, _agentKey, _agentRateKey, ")");
    spCoinLogger.logFunctionHeader("getSerializedAgentRateList = async(" + _sponsorKey + ", " + _recipientKey + ", " + _agentKey + ", " + _agentRateKey + ")");
    let agentRateRecordStr = await this.spCoinContractDeployed.connect(this.signer).serializeAgentRateRecordStr(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey);
    let agentRateRecordStrList = agentRateRecordStr.split(",");
    spCoinLogger.logExitFunction();
    return agentRateRecordStrList;
  }

  getSerializedAccountRecord = async (_accountKey) => {
    // console.log("==>3 getSerializedAccountRecord = async(" + _accountKey + ")");
    spCoinLogger.logFunctionHeader("getSerializedAccountRecord = async(" + _accountKey + ")");
    let serializedAccountRec =
      await this.spCoinContractDeployed.connect(this.signer).getSerializedAccountRecord(_accountKey);
      spCoinLogger.logExitFunction();
    return this.deSerializedAccountRec(serializedAccountRec);
  };

  getSerializedAccountRewards = async (_accountKey) => {
    // console.log("==>3 getSerializedAccountRewards = async(" + _accountKey + ")");
    spCoinLogger.logFunctionHeader("getSerializedAccountRewards = async(" + _accountKey + ")");
    let serializedAccountRec =
      await this.spCoinContractDeployed.connect(this.signer).getSerializedAccountRewards(_accountKey);
      spCoinLogger.logExitFunction();
    return this.deSerializedAccountRec(serializedAccountRec);
  };

  deserializeRateTransactionRecords = (transactionStr) => {
    spCoinLogger.logFunctionHeader("deserializeRateTransactionRecords = async(" + transactionStr + ")");
    //spCoinLogger.log("deserializeRateTransactionRecords = async(" + transactionStr + ")");
    let transactionRecs = [];
    if(transactionStr.length > 0) {
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
  }

  deserializedSPCoinHeader = async() => {
    // console.log("JS==>1 deserializedSPCoinHeader()");
    spCoinLogger.logFunctionHeader("getAccountRecords()");
    let sponsorCoinHeader = new SponsorCoinHeader();
    let headerData = await this.spCoinContractDeployed.connect(this.signer).getSerializedSPCoinHeader();
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
  }

  addSPCoinHeaderField = ( _key, _value, spCoinHeaderRecord ) => {
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
  }
  
  /*
  deserializedSPRewards = (stakingRewards) => {
    // console.log("JS==>1.0 deserializedSPCoinHeader(\n" + stakingRewards + ")");
    spCoinLogger.logFunctionHeader("getAccountRecords()");
    let rewardRecords = stakingRewards.split("RECORD_RATE_DATA\n");
    let sponsorCoinRewards = {};
    let recordArray = [];

    console.log("JS==>1.1 rewardRecords.length", rewardRecords.length);
    for (let i = 0; i < rewardRecords.length; i++) {
      let rewardRecord = rewardRecords[i].trim();
      if (i == 0) {
        sponsorCoinRewards.Header = this.addSPCoinRewardRecord(rewardRecord);
        // sponsorCoinRewards.Header = rewardRecord;
        sponsorCoinRewards.Body = recordArray;
      } else {
        let newRewardBody = {};
        newRewardBody.recordIndex = i;
        newRewardBody.rewardRecord = this.addSPCoinRewardRecord(rewardRecord);
        // newRewardBody.rewardRecord = rewardRecord;
        recordArray[i-1] = newRewardBody;
      }
    }
    // console.log("JS =>1.3 sponsorCoinRewards = " + spCoinLogger.logJSON(sponsorCoinRewards));
    return sponsorCoinRewards;
  }

  addSPCoinRewardRecord = (stakingRewards) => {
    console.log("JS==>1.0 addSPCoinRewardRecord(\n" + stakingRewards + ")");
    spCoinLogger.logFunctionHeader("getAccountRecords()");

    let sponsorCoinRecord = {};
    let rewardElements = stakingRewards.split("\n");
    console.log("JS==>1.1 rewardElements.length", rewardElements.length);
    for (let i = 0; i < rewardElements.length; i++) {
      let rewardElement = rewardElements[i].trim();
      let keyValue = rewardElement.split(":");
      spCoinLogger.logDetail("JS => keyValue = " + keyValue);
      // console.log("JS =>1.2 keyValue = " + keyValue);

      let key = keyValue[0].trim();
      let value = keyValue[1].trim();
      // spCoinLogger.log("JS =>1.3 key     = " + key);
      // spCoinLogger.log("JS =>1.4 value   = " + value);
      this.addSPCoinRewardField(key, value, sponsorCoinRecord);
    }
    console.log("JS =>1.3 sponsorCoinRecord = " + spCoinLogger.logJSON(sponsorCoinRecord));
    return sponsorCoinRecord;
  }


  addSPCoinRewardField = ( _key, _value, spCoinHeaderRecord ) => {
    // console.log("JS =>2.1 _key   = " + _key);
    // console.log("JS =>2.2 _value = " + _value);
    // console.log("JS =>2.3 spCoinHeaderRecord = " + spCoinLogger.logJSON(spCoinHeaderRecord));
    switch (_key.trim()) {
      case "RECIPIENT_KEYS_LENGTH":
        spCoinHeaderRecord.RECIPIENT_KEYS_LENGTH = bigIntToDecString(_value);
      break;
      case "RECIPIENT_IDX":
        spCoinHeaderRecord.RECIPIENT_IDX = bigIntToDecString(_value);
      break;
      case "RECIPIENT_KEY":
        spCoinHeaderRecord.RECIPIENT_KEY = _value;
      break;
      case "RECIPIENT_RATE_LIST_LENGTH":
        spCoinHeaderRecord.RECIPIENT_RATE_LIST_LENGTH = bigIntToDecString(_value);
      break;
      case "RECIPIENT_RATE":
        spCoinHeaderRecord.RECIPIENT_RATE = bigIntToDecString(_value);
      break;
      case "CURRENT_TIME_STAMP":
        spCoinHeaderRecord.CURRENT_TIME_STAMP = bigIntToDateTimeString(_value);
      break;
      case "LAST_UPDATE_TIME":
        spCoinHeaderRecord.LAST_UPDATE_TIME = bigIntToDateTimeString(_value);
      break;
      case "LAST_UPDATE_TIME":
        spCoinHeaderRecord.LAST_UPDATE_TIME = bigIntToDateTimeString(_value);
      break;
      case "TIME_DIFFERENCE":
        spCoinHeaderRecord.SECOND_TIME_DIFFERENCE = bigIntToDecString(_value);
        spCoinHeaderRecord.FORMATTED_TIME_DIFFERENCE = formatTimeSeconds(_value);
      break;
      case "STAKED_SPONSOR_COINS":
        spCoinHeaderRecord.STAKED_SPONSOR_COINS = bigIntToDecString(_value);
      break;
      case "TIME_RATE_MULTIPLIER":
        spCoinHeaderRecord.TIME_RATE_MULTIPLIER = bigIntToDecString(_value);
      break;
      case "YEAR_IN_SECONDS":
        spCoinHeaderRecord.YEAR_IN_SECONDS = bigIntToDecString(_value);
      break;
      case "CALCULATED_STAKING_REWARDS":
        spCoinHeaderRecord.CALCULATED_STAKING_REWARDS = bigIntToDecString(_value);
      break;
      default:
      break;
    }
  }
  */
}

module.exports = {
  SpCoinSerialize,
  bigIntToDateTimeString,
  bigIntToDecString,
  bigIntToHexString,
  bigIntToString,
  getLocation
};
