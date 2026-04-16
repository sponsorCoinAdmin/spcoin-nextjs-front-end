// @ts-nocheck
import getInflationRate from './getInflationRate';
import calculateStakingRewards from './calculateStakingRewards';
import getAccountList from './getAccountList';
import getRecipientRateList from './getRecipientRateList';
import getRecipientRateAgentList from './getRecipientRateAgentList';
import getLowerRecipientRate from './getLowerRecipientRate';
import getUpperRecipientRate from './getUpperRecipientRate';
import getRecipientRateRange from './getRecipientRateRange';
import getAgentRateList from './getAgentRateList';
import getLowerAgentRate from './getLowerAgentRate';
import getUpperAgentRate from './getUpperAgentRate';
import getAgentRateRange from './getAgentRateRange';
import initialTotalSupply from './initialTotalSupply';
import isAccountInserted from './isAccountInserted';
import masterAccountList from './masterAccountList';
import getStakingRewards from './getStakingRewards';
import getTimeMultiplier from './getTimeMultiplier';
import getAccountTimeInSecondeSinceUpdate from './getAccountTimeInSecondeSinceUpdate';
import totalUnstakedSpCoins from './totalUnstakedSpCoins';
import totalStakedSPCoins from './totalStakedSPCoins';
import totalStakingRewards from './totalStakingRewards';
import getVersion from './getVersion';
import getAccountRewardTransactionList from './getAccountRewardTransactionList';
import getAccountRewardTransactionRecord from './getAccountRewardTransactionRecord';
import getAccountRateRecordList from './getAccountRateRecordList';
import getRateTransactionList from './getRateTransactionList';
import getAccountListSize from './getAccountListSize';
import getAccountRecipientListSize from './getAccountRecipientListSize';
import getRecipientRateRecordList from './getRecipientRateRecordList';
import getRecipientRecordList from './getRecipientRecordList';
import getAgentRateRecordList from './getAgentRateRecordList';
import getAgentRecord from './getAgentRecord';
import getAgentRecordList from './getAgentRecordList';
import creationTime from './creationTime';
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
    getAccountList,
    getRecipientRateList,
    getRecipientRateAgentList,
    getLowerRecipientRate,
    getUpperRecipientRate,
    getRecipientRateRange,
    getAgentRateList,
    getLowerAgentRate,
    getUpperAgentRate,
    getAgentRateRange,
    initialTotalSupply,
    isAccountInserted,
    masterAccountList,
    getStakingRewards,
    getTimeMultiplier,
    getAccountTimeInSecondeSinceUpdate,
    totalUnstakedSpCoins,
    totalStakedSPCoins,
    totalStakingRewards,
    getVersion,
    getAccountRewardTransactionList,
    getAccountRewardTransactionRecord,
    getAccountRateRecordList,
    getRateTransactionList,
    getAccountListSize,
    getAccountRecipientListSize,
    getRecipientRateRecordList,
    getRecipientRecordList,
    getAgentRateRecordList,
    getAgentRecord,
    getAgentRecordList,
    creationTime,
    getSpCoinMetaData,
    getSerializedSPCoinHeader,
    getSerializedAccountRecord,
    getSerializedAccountRewards,
    getSerializedRecipientRecordList,
    getSerializedRecipientRateList,
    serializeAgentRateRecordStr,
    getSerializedRateTransactionList,
};
