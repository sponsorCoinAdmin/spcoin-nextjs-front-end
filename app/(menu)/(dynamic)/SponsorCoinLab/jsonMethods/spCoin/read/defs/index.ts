// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/read/defs/index.ts
import getInflationRate from './getInflationRate';
import calculateStakingRewards from './calculateStakingRewards';
import creationTime from './creationTime';
import getMasterAccountKeys from './getMasterAccountList';
import getMasterAccountMetaData from './getMasterAccountMetaData';
import getMasterAccountKeyCount from './getMasterAccountKeyCount';
import getActiveAccountKeys from './getActiveAccountList';
import getActiveAccountCount from './getActiveAccountListSize';
import getSpCoinMetaData from './getSpCoinMetaData';
import getSponsorKeys from './getSponsorKeys';
import getRecipientList from './getRecipientList';
import getAgentList from './getAgentList';
import getRecipientListSize from './getRecipientListSize';
import getAgentListSize from './getAgentListSize';
import getAccountCore from './getAccountCore';
import getAccountRecord from './getAccountRecord';
import getAccountRoleSummary from './getAccountRoleSummary';
import getAccountRoles from './getAccountRoles';
import getAccountStakingRewards from './getAccountStakingRewards';
import getAccountRewardTransactionList from './getAccountRewardTransactionList';
import getAccountRewardTransactionRecord from './getAccountRewardTransactionRecord';
import getAccountTransactionList from './getAccountTransactionList';
import getTransactionList from './getTransactionList';
import getTransactionRecord from './getTransactionRecord';
import getRateTransactionSetTransactionIdsPage from './getRateTransactionSetTransactionIdsPage';
import getSponsorContainerRecipientKeysPage from './getSponsorContainerRecipientKeysPage';
import getSponsorRecipientRateTransactionSetKeysPage from './getSponsorRecipientRateTransactionSetKeysPage';
import getSponsorAgentRateTransactionSetKeysPage from './getSponsorAgentRateTransactionSetKeysPage';
import getSponsorRecipientBoxRecipientRateTransactionSetKeysPage from './getSponsorRecipientBoxRecipientRateTransactionSetKeysPage';
import getSponsorRecipientBoxAgentRateTransactionSetKeysPage from './getSponsorRecipientBoxAgentRateTransactionSetKeysPage';
import getRecipientTransactionIdKeys from './getRecipientTransactionIdKeys';
import getAgentTransactionIdKeys from './getAgentTransactionIdKeys';
import getRecipientRateList from './getRecipientRateList';
import getRecipientRateTransactionSetKeysPage from './getRecipientRateTransactionSetKeysPage';
import getRecipientTransaction from './getRecipientTransaction';
import getRecipientTransactionList from './getRecipientTransactionList';
import getRecipientRateAgentList from './getRecipientRateAgentList';
import getRecipientTransactionAt from './getRecipientTransactionAt';
import getLowerRecipientRate from './getLowerRecipientRate';
import getUpperRecipientRate from './getUpperRecipientRate';
import getRecipientRateRange from './getRecipientRateRange';
import getRecipientRateIncrement from './getRecipientRateIncrement';
import getRecipient from './getRecipient';
import getRecipientRecordList from './getRecipientRecordList';
import getAgentRateList from './getAgentRateList';
import getAgentRateTransactionSetKeysPage from './getAgentRateTransactionSetKeysPage';
import getLowerAgentRate from './getLowerAgentRate';
import getUpperAgentRate from './getUpperAgentRate';
import getAgentRateRange from './getAgentRateRange';
import getAgentRateIncrement from './getAgentRateIncrement';
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
import getActiveAccountElement from './getActiveAccountElement';
import getStakingRewards from './getStakingRewards';
import calcDataTimeDiff from './getAccountTimeInSecondeSinceUpdate';
import totalUnstakedSpCoins from './totalUnstakedSpCoins';
import totalStakedSPCoins from './totalStakedSPCoins';
import totalStakingRewards from './totalStakingRewards';
import version from './version';
import isSponsor from './isSponsor';
import isRecipient from './isRecipient';
import isAgent from './isAgent';

export const SPCOIN_READ_METHOD_DEFS = {
  getInflationRate,
  calculateStakingRewards,
  creationTime,
  getMasterAccountMetaData,
  getMasterAccountKeys,
  getMasterAccountList: getMasterAccountKeys,
  getAccountKeys: getMasterAccountKeys,
  getMasterAccountKeyCount,
  getMasterAccountCount: getMasterAccountKeyCount,
  getMasterAccountListSize: getMasterAccountKeyCount,
  getAccountListSize: getMasterAccountKeyCount,
  getActiveAccountKeys,
  getActiveAccountList: getActiveAccountKeys,
  getActiveAccountCount,
  getActiveAccountListSize: getActiveAccountCount,
  getSpCoinMetaData,
  getSponsorKeys,
  getRecipientKeys: getRecipientList,
  getRecipientList,
  getAgentKeys: getAgentList,
  getAgentList,
  getRecipientKeyCount: getRecipientListSize,
  getRecipientListSize,
  getAgentKeyCount: getAgentListSize,
  getAgentListSize,
  getAccountCore,
  getAccountRecord,
  getAccountRoleSummary,
  getAccountRoles,
  isSponsor,
  isRecipient,
  isAgent,
  getAccountStakingRewards,
  getAccountRewardTransactionList,
  getAccountRewardTransactionRecord,
  getAccountTransactionList,
  getTransactionList,
  getTransactionRecord,
  getRateTransactionSetTransactionIdsPage,
  getSponsorContainerRecipientKeysPage,
  getSponsorRecipientRateTransactionSetKeysPage,
  getSponsorAgentRateTransactionSetKeysPage,
  getSponsorRecipientBoxRecipientRateTransactionSetKeysPage,
  getSponsorRecipientBoxAgentRateTransactionSetKeysPage,
  getRecipientTransactionIdKeys,
  getAgentTransactionIdKeys,
  getRecipientRateKeys: getRecipientRateList,
  getRecipientRateList,
  getRecipientRateTransactionSetKeysPage,
  getRecipientTransaction,
  getRecipientTransactionList,
  getRecipientRateAgentKeys: getRecipientRateAgentList,
  getRecipientRateAgentList,
  getLowerRecipientRate,
  getUpperRecipientRate,
  getRecipientRateRange,
  getRecipientRateIncrement,
  getRecipient,
  getRecipientRecordList,
  getAgentRateKeys: getAgentRateList,
  getAgentRateList,
  getAgentRateTransactionSetKeysPage,
  getLowerAgentRate,
  getUpperAgentRate,
  getAgentRateRange,
  getAgentRateIncrement,
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
  getActiveAccountElement,
  getActiveAccountKeyAt: getActiveAccountElement,
  getStakingRewards,
  calcDataTimeDiff,
  totalUnstakedSpCoins,
  totalStakedSPCoins,
  totalStakingRewards,
  version,
};
