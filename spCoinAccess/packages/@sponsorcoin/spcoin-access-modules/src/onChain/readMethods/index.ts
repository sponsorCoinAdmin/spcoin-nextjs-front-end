// @ts-nocheck
import getInflationRate from './getInflationRate';
import calculateStakingRewards from './calculateStakingRewards';
import getMasterAccountList from './getMasterAccountList';
import getRecipientRateList from './getRecipientRateList';
import getRecipientRateAgentList from './getRecipientRateAgentList';
import getLowerRecipientRate from './getLowerRecipientRate';
import getUpperRecipientRate from './getUpperRecipientRate';
import getRecipientRateRange from './getRecipientRateRange';
import getAgentRateList from './getAgentRateList';
import getLowerAgentRate from './getLowerAgentRate';
import getUpperAgentRate from './getUpperAgentRate';
import getAgentRateRange from './getAgentRateRange';
import getInitialTotalSupply from './getInitialTotalSupply';
import isDeployed from './isDeployed';
import isAccountInserted from './isAccountInserted';
import getMasterAccountElement from './getMasterAccountElement';
import getStakingRewards from './getStakingRewards';
import getAccountTimeInSecondeSinceUpdate from './getAccountTimeInSecondeSinceUpdate';
import totalUnstakedSpCoins from './totalUnstakedSpCoins';
import totalStakedSPCoins from './totalStakedSPCoins';
import totalStakingRewards from './totalStakingRewards';
import getVersion from './getVersion';
import getAccountRewardTransactionList from './getAccountRewardTransactionList';
import getAccountRewardTransactionRecord from './getAccountRewardTransactionRecord';
import getAccountRateRecordList from './getAccountRateRecordList';
import getRateTransactionList from './getRateTransactionList';
import getMasterAccountListSize from './getAccountListSize';
import getRecipientList from './getAccountRecipientList';
import getAgentList from './getAccountAgentList';
import getRecipientListSize from './getAccountRecipientListSize';
import getAgentListSize from './getAgentListSize';
import getRecipientRateRecordList from './getRecipientRateRecordList';
import getRecipientRecordList from './getRecipientRecordList';
import getAgentRateRecordList from './getAgentRateRecordList';
import getRecipientRateTransactionCount from './getRecipientRateTransactionCount';
import getAgentRateTransactionCount from './getAgentRateTransactionCount';
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
import serializeAgentRateRecordStr from './serializeAgentRateRecordStr';
import getSerializedRateTransactionList from './getSerializedRateTransactionList';
export const ONCHAIN_READ_METHOD_HANDLERS = {
    getInflationRate,
    calculateStakingRewards,
    getMasterAccountList,
    getRecipientRateList,
    getRecipientRateAgentList,
    getLowerRecipientRate,
    getUpperRecipientRate,
    getRecipientRateRange,
    getAgentRateList,
    getLowerAgentRate,
    getUpperAgentRate,
    getAgentRateRange,
    getInitialTotalSupply,
    isDeployed,
    isAccountInserted,
    getMasterAccountElement,
    getStakingRewards,
    getAccountTimeInSecondeSinceUpdate,
    totalUnstakedSpCoins,
    totalStakedSPCoins,
    totalStakingRewards,
    getVersion,
    getAccountRewardTransactionList,
    getAccountRewardTransactionRecord,
    getAccountRateRecordList,
    getRateTransactionList,
    getMasterAccountListSize,
    getRecipientList,
    getAgentList,
    getRecipientListSize,
    getAgentListSize,
    getRecipientRateRecordList,
    getRecipientRecordList,
    getAgentRateRecordList,
    getRecipientRateTransactionCount,
    getAgentRateTransactionCount,
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
    serializeAgentRateRecordStr,
    getSerializedRateTransactionList,
};

