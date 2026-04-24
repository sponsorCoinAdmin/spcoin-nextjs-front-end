// @ts-nocheck
import compareSpCoinContractSize from './compareSpCoinContractSize';
import getAccountRecord from './getAccountRecord';
import getAccountStakingRewards from './getAccountStakingRewards';
import getRecipient from './getRecipient';
import getRecipientTransaction from './getRecipientTransaction';
import getAgentTransaction from './getAgentTransaction';
export const OFFCHAIN_READ_METHOD_HANDLERS = {
    compareSpCoinContractSize,
    getAccountRecord,
    getAccountStakingRewards,
    getRecipient,
    getRecipientTransaction,
    getAgentTransaction,
};

