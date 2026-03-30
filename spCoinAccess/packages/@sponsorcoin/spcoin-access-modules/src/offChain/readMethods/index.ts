// @ts-nocheck
import compareSpCoinContractSize from './compareSpCoinContractSize';
import getSPCoinHeaderRecord from './getSPCoinHeaderRecord';
import getAccountRecord from './getAccountRecord';
import getOffLineAccountRecords from './getOffLineAccountRecords';
import getAccountStakingRewards from './getAccountStakingRewards';
import getRecipientRecord from './getRecipientRecord';
import getRecipientRateRecord from './getRecipientRateRecord';
import getAgentRateRecord from './getAgentRateRecord';
import getAgentRateTransactionList from './getAgentRateTransactionList';
export const OFFCHAIN_READ_METHOD_HANDLERS = {
    compareSpCoinContractSize,
    getSPCoinHeaderRecord,
    getAccountRecord,
    getOffLineAccountRecords,
    getAccountStakingRewards,
    getRecipientRecord,
    getRecipientRateRecord,
    getAgentRateRecord,
    getAgentRateTransactionList,
};

