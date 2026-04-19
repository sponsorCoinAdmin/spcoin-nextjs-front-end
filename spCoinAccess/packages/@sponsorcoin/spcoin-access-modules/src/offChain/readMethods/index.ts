// @ts-nocheck
import compareSpCoinContractSize from './compareSpCoinContractSize';
import getAccountRecord from './getAccountRecord';
import getAccountStakingRewards from './getAccountStakingRewards';
import getRecipientRecord from './getRecipientRecord';
import getRecipientRateRecord from './getRecipientRateRecord';
import getAgentRateTransaction from './getAgentRateRecord';
export const OFFCHAIN_READ_METHOD_HANDLERS = {
    compareSpCoinContractSize,
    getAccountRecord,
    getAccountStakingRewards,
    getRecipientRecord,
    getRecipientRateRecord,
    getAgentRateTransaction,
};

