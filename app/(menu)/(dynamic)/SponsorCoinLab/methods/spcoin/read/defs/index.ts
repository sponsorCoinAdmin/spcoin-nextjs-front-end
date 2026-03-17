// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/read/defs/index.ts
import getSerializedSPCoinHeader from './getSerializedSPCoinHeader';
import annualInflation from './annualInflation';
import calculateStakingRewards from './calculateStakingRewards';
import creationTime from './creationTime';
import getAccountList from './getAccountList';
import getAccountListSize from './getAccountListSize';
import getRateTransactionStr from './getRateTransactionStr';
import getSPCoinHeaderRecord from './getSPCoinHeaderRecord';
import getAccountRecipientList from './getAccountRecipientList';
import getAccountRecipientListSize from './getAccountRecipientListSize';
import getSerializedAccountRecord from './getSerializedAccountRecord';
import getAccountRecord from './getAccountRecord';
import getAccountRecords from './getAccountRecords';
import getSerializedAccountRewards from './getSerializedAccountRewards';
import getAccountStakingRewards from './getAccountStakingRewards';
import getRewardAccounts from './getRewardAccounts';
import getRewardTypeRecord from './getRewardTypeRecord';
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
import getRecipientRecord from './getRecipientRecord';
import getRecipientRecordList from './getRecipientRecordList';
import getAgentRateList from './getAgentRateList';
import getAgentRateRecord from './getAgentRateRecord';
import getAgentRateRecordList from './getAgentRateRecordList';
import getAgentTotalRecipient from './getAgentTotalRecipient';
import getSerializedRateTransactionList from './getSerializedRateTransactionList';
import getAgentRateTransactionList from './getAgentRateTransactionList';
import getRecipientRateTransactionList from './getRecipientRateTransactionList';
import getAgentRecord from './getAgentRecord';
import getAgentRecordList from './getAgentRecordList';
import initialTotalSupply from './initialTotalSupply';
import isAccountInserted from './isAccountInserted';
import masterAccountList from './masterAccountList';
import msgSender from './msgSender';
import serializeAgentRateRecordStr from './serializeAgentRateRecordStr';
import strToUint from './strToUint';
import testStakingRewards from './testStakingRewards';
import getStakingRewards from './getStakingRewards';
import getTimeMultiplier from './getTimeMultiplier';
import getAccountTimeInSecondeSinceUpdate from './getAccountTimeInSecondeSinceUpdate';
import getMillenniumTimeIntervalDivisor from './getMillenniumTimeIntervalDivisor';
import totalBalanceOf from './totalBalanceOf';
import totalStakedSPCoins from './totalStakedSPCoins';
import totalStakingRewards from './totalStakingRewards';
import version from './version';

export const SPCOIN_READ_METHOD_DEFS = {
  getSerializedSPCoinHeader,
  annualInflation,
  calculateStakingRewards,
  creationTime,
  getAccountList,
  getAccountListSize,
  getRateTransactionStr,
  getSPCoinHeaderRecord,
  getAccountRecipientList,
  getAccountRecipientListSize,
  getSerializedAccountRecord,
  getAccountRecord,
  getAccountRecords,
  getSerializedAccountRewards,
  getAccountStakingRewards,
  getRewardAccounts,
  getRewardTypeRecord,
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
  getRecipientRecord,
  getRecipientRecordList,
  getAgentRateList,
  getAgentRateRecord,
  getAgentRateRecordList,
  getAgentTotalRecipient,
  getSerializedRateTransactionList,
  getAgentRateTransactionList,
  getRecipientRateTransactionList,
  getAgentRecord,
  getAgentRecordList,
  initialTotalSupply,
  isAccountInserted,
  masterAccountList,
  msgSender,
  serializeAgentRateRecordStr,
  strToUint,
  testStakingRewards,
  getStakingRewards,
  getTimeMultiplier,
  getAccountTimeInSecondeSinceUpdate,
  getMillenniumTimeIntervalDivisor,
  totalBalanceOf,
  totalStakedSPCoins,
  totalStakingRewards,
  version,
};
