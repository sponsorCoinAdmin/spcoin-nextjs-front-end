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
import getAccountTransactionList from './getAccountTransactionList';
import getTransactionList from './getTransactionList';
import getRecipientRateList from './getRecipientRateList';
import getRecipientTransaction from './getRecipientTransaction';
import getRecipientTransactionList from './getRecipientTransactionList';
import getRecipientRateAgentList from './getRecipientRateAgentList';
import getRecipientTransactionAt from './getRecipientTransactionAt';
import getLowerRecipientRate from './getLowerRecipientRate';
import getUpperRecipientRate from './getUpperRecipientRate';
import getRecipientRateRange from './getRecipientRateRange';
import getRecipient from './getRecipient';
import getRecipientRecordList from './getRecipientRecordList';
import getAgentRateList from './getAgentRateList';
import getLowerAgentRate from './getLowerAgentRate';
import getUpperAgentRate from './getUpperAgentRate';
import getAgentRateRange from './getAgentRateRange';
import getAgentTransaction from './getAgentTransaction';
import getAgentTotalRecipient from './getAgentTotalRecipient';
import getRecipientTransactionCount from './getRecipientTransactionCount';
import getAgentTransactionCount from './getAgentTransactionCount';
import getAgentTransactionAt from './getAgentTransactionAt';
import getAgentTransactionList from './getAgentTransactionList';
import getAgent from './getAgent';
import getAgentRecordList from './getAgentRecordList';
import totalInitialSupply from './getInitialTotalSupply';
import isDeployed from './isDeployed';
import isAccountInserted from './isAccountInserted';
import getAccountElement from './getMasterAccountElement';
import getStakingRewards from './getStakingRewards';
import calcDataTimeDiff from './getAccountTimeInSecondeSinceUpdate';
import totalUnstakedSpCoins from './totalUnstakedSpCoins';
import totalStakedSPCoins from './totalStakedSPCoins';
import totalStakingRewards from './totalStakingRewards';
import version from './version';

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
  getAccountTransactionList,
  getTransactionList,
  getRecipientRateKeys: getRecipientRateList,
  getRecipientRateList,
  getRecipientTransaction,
  getRecipientTransactionList,
  getRecipientRateAgentKeys: getRecipientRateAgentList,
  getRecipientRateAgentList,
  getLowerRecipientRate,
  getUpperRecipientRate,
  getRecipientRateRange,
  getRecipient,
  getRecipientRecordList,
  getAgentRateKeys: getAgentRateList,
  getAgentRateList,
  getLowerAgentRate,
  getUpperAgentRate,
  getAgentRateRange,
  getAgentTransaction,
  getAgentTotalRecipient,
  getRecipientTransactionCount,
  getAgentTransactionCount,
  getRecipientTransactionAt,
  getAgentTransactionAt,
  getAgentTransactionList,
  getAgent,
  getAgentRecordList,
  totalInitialSupply,
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
  version,
};
