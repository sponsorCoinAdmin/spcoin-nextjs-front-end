// @ts-nocheck
import compareSpCoinContractSize from './compareSpCoinContractSize';
import getAccountRecord from './getAccountRecord';
import getAccountStakingRewards from './getAccountStakingRewards';
import getRecipientRecord from './getRecipientRecord';
import getRecipientRateTransaction from './getRecipientRateTransaction';
import getAgentRateTransaction from './getAgentRateTransaction';
export const OFFCHAIN_READ_METHOD_HANDLERS = {
    compareSpCoinContractSize,
    getAccountRecord,
    getAccountStakingRewards,
    getRecipientRecord,
    getRecipientRateTransaction,
    getAgentRateTransaction,
};

