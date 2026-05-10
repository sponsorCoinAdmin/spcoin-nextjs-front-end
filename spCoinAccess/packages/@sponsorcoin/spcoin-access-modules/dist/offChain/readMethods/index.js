// @ts-nocheck
import compareSpCoinContractSize from './compareSpCoinContractSize';
import getAccountRecord from './getAccountRecord';
import getAccountStakingRewards from './getAccountStakingRewards';
import getPendingRewards from './getPendingRewards';
import getRecipientRecord from './getRecipientRecord';
import getRecipientTransaction from './getRecipientTransaction';
import getAgentTransaction from './getAgentTransaction';
export const OFFCHAIN_READ_METHOD_HANDLERS = {
    compareSpCoinContractSize,
    getAccountRecord,
    getAccountStakingRewards,
    getPendingRewards,
    getRecipientRecord,
    getRecipientTransaction,
    getAgentTransaction,
};
