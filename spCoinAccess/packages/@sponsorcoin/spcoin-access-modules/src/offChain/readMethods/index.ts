// @ts-nocheck
import compareSpCoinContractSize from './compareSpCoinContractSize';
import getAccountRoleSummary from './getAccountRoleSummary';
import getAccountRoles from './getAccountRoles';
import getAccountRecordShallow from './getAccountRecordShallow';
import getAccountStakingRewards from './getAccountStakingRewards';
import {
    estimateOffChainTotalRewards,
    estimateOffChainSponsorRewards,
    estimateOffChainRecipientRewards,
    estimateOffChainAgentRewards,
} from './estimateOffChainRewards';
import getRecipient from './getRecipient';
import getRecipientTransaction from './getRecipientTransaction';
import getAgentTransaction from './getAgentTransaction';
import getAgentRateTransactionCount from './getAgentRateTransactionCount';
import isSponsor from './isSponsor';
import isRecipient from './isRecipient';
import isAgent from './isAgent';
export const OFFCHAIN_READ_METHOD_HANDLERS = {
    compareSpCoinContractSize,
    getAccountRoleSummary,
    getAccountRoles,
    getAccountRecordShallow,
    getAccountStakingRewards,
    estimateOffChainTotalRewards,
    estimateOffChainSponsorRewards,
    estimateOffChainRecipientRewards,
    estimateOffChainAgentRewards,
    getRecipient,
    getRecipientTransaction,
    getAgentTransaction,
    getAgentRateTransactionCount,
    isSponsor,
    isRecipient,
    isAgent,
};

