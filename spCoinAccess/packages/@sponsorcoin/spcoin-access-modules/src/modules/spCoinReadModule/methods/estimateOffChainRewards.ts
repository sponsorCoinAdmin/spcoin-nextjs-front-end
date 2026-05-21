// @ts-nocheck
import { computeOffChainRewardsEstimate } from './computeOffChainRewardsEstimate';

async function getPending(context, accountKey, optionsOrTimestampOverride = undefined, timestampOverride = undefined) {
    return await computeOffChainRewardsEstimate(context, accountKey, optionsOrTimestampOverride, timestampOverride);
}

function selectRewards(result, role) {
    const pending = result && typeof result === "object" ? result : {};
    const pendingSponsorRewards = String(pending.pendingSponsorRewards ?? "0");
    const pendingRecipientRewards = String(pending.pendingRecipientRewards ?? "0");
    const pendingAgentRewards = String(pending.pendingAgentRewards ?? "0");
    const pendingTotalRewards = String(pending.pendingRewards ?? "0");
    if (role === "sponsor") {
        return {
            TYPE: "--ACCOUNT_PENDING_SPONSOR_REWARDS--",
            accountKey: String(pending.accountKey ?? ""),
            calculatedTimeStamp: String(pending.calculatedTimeStamp ?? "0"),
            calculatedFormatted: String(pending.calculatedFormatted ?? ""),
            lastSponsorUpdate: String(pending.lastSponsorUpdate ?? "0"),
            pendingSponsorRewards,
            pendingRecipientRewards,
            pendingAgentRewards,
            pendingTotalRewards,
        };
    }
    if (role === "recipient") {
        return {
            TYPE: "--ACCOUNT_PENDING_RECIPIENT_REWARDS--",
            accountKey: String(pending.accountKey ?? ""),
            calculatedTimeStamp: String(pending.calculatedTimeStamp ?? "0"),
            calculatedFormatted: String(pending.calculatedFormatted ?? ""),
            lastRecipientUpdate: String(pending.lastRecipientUpdate ?? "0"),
            pendingSponsorRewards,
            pendingRecipientRewards,
            pendingAgentRewards,
            pendingTotalRewards,
        };
    }
    if (role === "agent") {
        return {
            TYPE: "--ACCOUNT_PENDING_AGENT_REWARDS--",
            accountKey: String(pending.accountKey ?? ""),
            calculatedTimeStamp: String(pending.calculatedTimeStamp ?? "0"),
            calculatedFormatted: String(pending.calculatedFormatted ?? ""),
            lastAgentUpdate: String(pending.lastAgentUpdate ?? "0"),
            pendingSponsorRewards,
            pendingRecipientRewards,
            pendingAgentRewards,
            pendingTotalRewards,
        };
    }
    return {
        ...pending,
        TYPE: "--ACCOUNT_PENDING_TOTAL_REWARDS--",
        pendingTotalRewards: String(pending.pendingRewards ?? "0"),
    };
}

export const estimateOffChainTotalRewards = async (context, accountKey, optionsOrTimestampOverride = undefined, timestampOverride = undefined) =>
    selectRewards(await getPending(context, accountKey, optionsOrTimestampOverride, timestampOverride), "total");
export const estimateOffChainSponsorRewards = async (context, accountKey, optionsOrTimestampOverride = undefined, timestampOverride = undefined) =>
    selectRewards(await getPending(context, accountKey, optionsOrTimestampOverride, timestampOverride), "sponsor");
export const estimateOffChainRecipientRewards = async (context, accountKey, optionsOrTimestampOverride = undefined, timestampOverride = undefined) =>
    selectRewards(await getPending(context, accountKey, optionsOrTimestampOverride, timestampOverride), "recipient");
export const estimateOffChainAgentRewards = async (context, accountKey, optionsOrTimestampOverride = undefined, timestampOverride = undefined) =>
    selectRewards(await getPending(context, accountKey, optionsOrTimestampOverride, timestampOverride), "agent");
