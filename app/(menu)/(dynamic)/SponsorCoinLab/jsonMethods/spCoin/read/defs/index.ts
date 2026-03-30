// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/read/defs/index.ts
import getSerializedSPCoinHeader from './getSerializedSPCoinHeader';
import getInflationRate from './getInflationRate';
import compareSpCoinContractSize from './compareSpCoinContractSize';
import calculateStakingRewards from './calculateStakingRewards';
import creationTime from './creationTime';
import getAccountList from './getAccountList';
import getAccountListSize from './getAccountListSize';
import getSPCoinHeaderRecord from './getSPCoinHeaderRecord';
import getSpCoinMetaData from './getSpCoinMetaData';
import getAccountRecipientList from './getAccountRecipientList';
import getAccountRecipientListSize from './getAccountRecipientListSize';
import getSerializedAccountRecord from './getSerializedAccountRecord';
import getAccountRecord from './getAccountRecord';
import getOffLineAccountRecords from './getOffLineAccountRecords';
import getSerializedAccountRewards from './getSerializedAccountRewards';
import getAccountStakingRewards from './getAccountStakingRewards';
import getSerializedRecipientRateList from './getSerializedRecipientRateList';
import getSerializedRecipientRecordList from './getSerializedRecipientRecordList';
import getAccountRewardTransactionList from './getAccountRewardTransactionList';
import getAccountRewardTransactionRecord from './getAccountRewardTransactionRecord';
import getAccountRateRecordList from './getAccountRateRecordList';
import getRateTransactionList from './getRateTransactionList';
import getRecipientRateList from './getRecipientRateList';
import getRecipientRateRecord from './getRecipientRateRecord';
import getRecipientRateRecordList from './getRecipientRateRecordList';
import getRecipientRateAgentList from './getRecipientRateAgentList';
import getLowerRecipientRate from './getLowerRecipientRate';
import getUpperRecipientRate from './getUpperRecipientRate';
import getRecipientRateRange from './getRecipientRateRange';
import getRecipientRecord from './getRecipientRecord';
import getRecipientRecordList from './getRecipientRecordList';
import getAgentRateList from './getAgentRateList';
import getLowerAgentRate from './getLowerAgentRate';
import getUpperAgentRate from './getUpperAgentRate';
import getAgentRateRange from './getAgentRateRange';
import getAgentRateRecord from './getAgentRateRecord';
import getAgentRateRecordList from './getAgentRateRecordList';
import getAgentTotalRecipient from './getAgentTotalRecipient';
import getSerializedRateTransactionList from './getSerializedRateTransactionList';
import getAgentRateTransactionList from './getAgentRateTransactionList';
import getAgentRecord from './getAgentRecord';
import getAgentRecordList from './getAgentRecordList';
import initialTotalSupply from './initialTotalSupply';
import isAccountInserted from './isAccountInserted';
import masterAccountList from './masterAccountList';
import serializeAgentRateRecordStr from './serializeAgentRateRecordStr';
import getStakingRewards from './getStakingRewards';
import getTimeMultiplier from './getTimeMultiplier';
import getAccountTimeInSecondeSinceUpdate from './getAccountTimeInSecondeSinceUpdate';
import getMillenniumTimeIntervalDivisor from './getMillenniumTimeIntervalDivisor';
import totalBalanceOf from './totalBalanceOf';
import totalStakedSPCoins from './totalStakedSPCoins';
import totalStakingRewards from './totalStakingRewards';
import getVersion from './version';

export const SPCOIN_READ_METHOD_DEFS = {
  getSerializedSPCoinHeader,
  getInflationRate,
  compareSpCoinContractSize,
  calculateStakingRewards,
  creationTime,
  getAccountList,
  getAccountListSize,
  getSPCoinHeaderRecord,
  getSpCoinMetaData,
  getAccountRecipientList,
  getAccountRecipientListSize,
  getSerializedAccountRecord,
  getAccountRecord,
  getOffLineAccountRecords,
  getSerializedAccountRewards,
  getAccountStakingRewards,
  getSerializedRecipientRateList,
  getSerializedRecipientRecordList,
  getAccountRewardTransactionList,
  getAccountRewardTransactionRecord,
  getAccountRateRecordList,
  getRateTransactionList,
  getRecipientRateList,
  getRecipientRateRecord,
  getRecipientRateRecordList,
  getRecipientRateAgentList,
  getLowerRecipientRate,
  getUpperRecipientRate,
  getRecipientRateRange,
  getRecipientRecord,
  getRecipientRecordList,
  getAgentRateList,
  getLowerAgentRate,
  getUpperAgentRate,
  getAgentRateRange,
  getAgentRateRecord,
  getAgentRateRecordList,
  getAgentTotalRecipient,
  getSerializedRateTransactionList,
  getAgentRateTransactionList,
  getAgentRecord,
  getAgentRecordList,
  initialTotalSupply,
  isAccountInserted,
  masterAccountList,
  serializeAgentRateRecordStr,
  getStakingRewards,
  getTimeMultiplier,
  getAccountTimeInSecondeSinceUpdate,
  getMillenniumTimeIntervalDivisor,
  totalBalanceOf,
  totalStakedSPCoins,
  totalStakingRewards,
  getVersion,
};
