// @ts-nocheck
import getInflationRate from './getInflationRate';
import calculateStakingRewards from './calculateStakingRewards';
import getAccountKeys from './getMasterAccountList';
import getRecipientRateKeys from './getRecipientRateList';
import getRecipientRateAgentKeys from './getRecipientRateAgentList';
import getLowerRecipientRate from './getLowerRecipientRate';
import getUpperRecipientRate from './getUpperRecipientRate';
import getRecipientRateRange from './getRecipientRateRange';
import getAgentRateKeys from './getAgentRateList';
import getLowerAgentRate from './getLowerAgentRate';
import getUpperAgentRate from './getUpperAgentRate';
import getAgentRateRange from './getAgentRateRange';
import getInitialTotalSupply from './getInitialTotalSupply';
import isDeployed from './isDeployed';
import isAccountInserted from './isAccountInserted';
import getAccountElement from './getMasterAccountElement';
import getStakingRewards from './getStakingRewards';
import getAccountTimeInSecondeSinceUpdate from './getAccountTimeInSecondeSinceUpdate';
import totalUnstakedSpCoins from './totalUnstakedSpCoins';
import totalStakedSPCoins from './totalStakedSPCoins';
import totalStakingRewards from './totalStakingRewards';
import getVersion from './getVersion';
import getAccountRewardTransactionList from './getAccountRewardTransactionList';
import getAccountRewardTransactionRecord from './getAccountRewardTransactionRecord';
import getAccountRateTransactionList from './getAccountRateTransactionList';
import getRateTransactionList from './getRateTransactionList';
import getAccountKeyCount from './getAccountListSize';
import getRecipientKeys from './getAccountRecipientList';
import getAgentKeys from './getAccountAgentList';
import getRecipientKeyCount from './getAccountRecipientListSize';
import getAgentKeyCount from './getAgentListSize';
import getRecipientRateTransactionList from './getRecipientRateTransactionList';
import getRecipientRecordList from './getRecipientRecordList';
import getAgentRateTransactionList from './getAgentRateTransactionList';
import getRecipientRateTransactionCount from './getRecipientRateTransactionCount';
import getAgentRateTransactionCount from './getAgentRateTransactionCount';
import getRecipientRateTransactionAt from './getRecipientRateTransactionAt';
import getAgentRateTransactionAt from './getAgentRateTransactionAt';
import getAgentRecord from './getAgentRecord';
import getAgentRecordList from './getAgentRecordList';
import getCreationTime from './getCreationTime';
import getSpCoinMetaData from './getSpCoinMetaData';
import getSerializedSPCoinHeader from './getSerializedSPCoinHeader';
import getSerializedAccountRecord from './getSerializedAccountRecord';
import getSerializedAccountRewards from './getSerializedAccountRewards';
import getSerializedRecipientRecordList from './getSerializedRecipientRecordList';
import getSerializedRecipientRateList from './getSerializedRecipientRateList';
import serializeAgentRateTransactionStr from './serializeAgentRateTransactionStr';
import getSerializedRateTransactionList from './getSerializedRateTransactionList';
export const ONCHAIN_READ_METHOD_HANDLERS = {
    getInflationRate,
    calculateStakingRewards,
    getMasterAccountKeys: getAccountKeys,
    getAccountKeys,
    getRecipientRateKeys,
    getRecipientRateAgentKeys,
    getLowerRecipientRate,
    getUpperRecipientRate,
    getRecipientRateRange,
    getAgentRateKeys,
    getLowerAgentRate,
    getUpperAgentRate,
    getAgentRateRange,
    getInitialTotalSupply,
    isDeployed,
    isAccountInserted,
    getMasterAccountElement: getAccountElement,
    getAccountElement,
    getStakingRewards,
    getAccountTimeInSecondeSinceUpdate,
    totalUnstakedSpCoins,
    totalStakedSPCoins,
    totalStakingRewards,
    getVersion,
    getAccountRewardTransactionList,
    getAccountRewardTransactionRecord,
    getAccountRateTransactionList,
    getRateTransactionList,
    getMasterAccountCount: getAccountKeyCount,
    getAccountKeyCount,
    getRecipientKeys,
    getAgentKeys,
    getRecipientKeyCount,
    getAgentKeyCount,
    getRecipientRateTransactionList,
    getRecipientRecordList,
    getAgentRateTransactionList,
    getRecipientRateTransactionCount,
    getAgentRateTransactionCount,
    getRecipientRateTransactionAt,
    getAgentRateTransactionAt,
    getAgentRecord,
    getAgentRecordList,
    getCreationTime,
    getSpCoinMetaData,
    getSerializedSPCoinHeader,
    getSerializedAccountRecord,
    getSerializedAccountRewards,
    getSerializedRecipientRecordList,
    getSerializedRecipientRateList,
    serializeAgentRateTransactionStr,
    getSerializedRateTransactionList,
    getMasterAccountList: getAccountKeys,
    getMasterAccountKeyAt: getAccountElement,
    getAccountKeyAt: getAccountElement,
    getMasterAccountListSize: getAccountKeyCount,
    getRecipientList: getRecipientKeys,
    getAgentList: getAgentKeys,
    getRecipientListSize: getRecipientKeyCount,
    getAgentListSize: getAgentKeyCount,
    getRecipientRateList: getRecipientRateKeys,
    getRecipientRateAgentList: getRecipientRateAgentKeys,
    getAgentRateList: getAgentRateKeys,
    creationTime: getCreationTime,
};

