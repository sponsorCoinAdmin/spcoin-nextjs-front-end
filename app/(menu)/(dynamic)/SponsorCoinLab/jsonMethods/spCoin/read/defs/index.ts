// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/read/defs/index.ts
import getInflationRate from './getInflationRate';
import calculateStakingRewards from './calculateStakingRewards';
import creationTime from './creationTime';
import getMasterAccountKeys from './getMasterAccountList';
import getMasterAccountKeyCount from './getMasterAccountListSize';
import getSpCoinMetaData from './getSpCoinMetaData';
import getRecipientList from './getRecipientList';
import getAgentList from './getAgentList';
import getRecipientListSize from './getRecipientListSize';
import getAgentListSize from './getAgentListSize';
import getAccountRecord from './getAccountRecord';
import getAccountStakingRewards from './getAccountStakingRewards';
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
import getAgentTotalRecipient from './getAgentTotalRecipient';
import getRecipientRateTransactionCount from './getRecipientRateTransactionCount';
import getAgentRateTransactionCount from './getAgentRateTransactionCount';
import getAgentRateTransactionAt from './getAgentRateTransactionAt';
import getAgentRateTransactionList from './getAgentRateTransactionList';
import getAgentRecord from './getAgentRecord';
import getAgentRecordList from './getAgentRecordList';
import getInitialTotalSupply from './getInitialTotalSupply';
import isDeployed from './isDeployed';
import isAccountInserted from './isAccountInserted';
import getAccountElement from './getMasterAccountElement';
import getStakingRewards from './getStakingRewards';
import calcDataTimeDiff from './getAccountTimeInSecondeSinceUpdate';
import totalUnstakedSpCoins from './totalUnstakedSpCoins';
import totalStakedSPCoins from './totalStakedSPCoins';
import totalStakingRewards from './totalStakingRewards';
import getVersion from './version';

export const SPCOIN_READ_METHOD_DEFS = {
  getInflationRate,
  calculateStakingRewards,
  creationTime,
  getMasterAccountKeys,
  getMasterAccountList: getMasterAccountKeys,
  getAccountKeys: getMasterAccountKeys,
  getMasterAccountCount: getMasterAccountKeyCount,
  getMasterAccountListSize: getMasterAccountKeyCount,
  getAccountListSize: getMasterAccountKeyCount,
  getAccountKeyCount: getMasterAccountKeyCount,
  getSpCoinMetaData,
  getRecipientKeys: getRecipientList,
  getRecipientList,
  getAgentKeys: getAgentList,
  getAgentList,
  getRecipientKeyCount: getRecipientListSize,
  getRecipientListSize,
  getAgentKeyCount: getAgentListSize,
  getAgentListSize,
  getAccountRecord,
  getAccountStakingRewards,
  getAccountRewardTransactionList,
  getAccountRewardTransactionRecord,
  getAccountRateRecordList,
  getRateTransactionList,
  getRecipientRateKeys: getRecipientRateList,
  getRecipientRateList,
  getRecipientRateRecord,
  getRecipientRateRecordList,
  getRecipientRateAgentKeys: getRecipientRateAgentList,
  getRecipientRateAgentList,
  getLowerRecipientRate,
  getUpperRecipientRate,
  getRecipientRateRange,
  getRecipientRecord,
  getRecipientRecordList,
  getAgentRateKeys: getAgentRateList,
  getAgentRateList,
  getLowerAgentRate,
  getUpperAgentRate,
  getAgentRateRange,
  getAgentRateRecord,
  getAgentTotalRecipient,
  getRecipientRateTransactionCount,
  getAgentRateTransactionCount,
  getAgentRateTransactionAt,
  getAgentRateTransactionList,
  getAgentRecord,
  getAgentRecordList,
  getInitialTotalSupply,
  isDeployed,
  isAccountInserted,
  getMasterAccountElement: getAccountElement,
  getAccountElement,
  getMasterAccountKeyAt: getAccountElement,
  getAccountKeyAt: getAccountElement,
  getStakingRewards,
  calcDataTimeDiff,
  totalUnstakedSpCoins,
  totalStakedSPCoins,
  totalStakingRewards,
  getVersion,
};
