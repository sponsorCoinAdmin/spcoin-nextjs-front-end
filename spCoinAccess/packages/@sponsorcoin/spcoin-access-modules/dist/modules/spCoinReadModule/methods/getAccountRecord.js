// @ts-nocheck
import { PendingRewardsByTypeStruct } from "../../../dataTypes/spCoinDataTypes";
function toBigIntValue(value) {
    const normalized = String(value ?? "0").replace(/,/g, "").trim();
    if (!normalized)
        return 0n;
    try {
        return BigInt(normalized);
    }
    catch (_error) {
        return 0n;
    }
}
async function getPendingRewardsSummary(runtime, accountKey) {
    const rewardsByType = await runtime.getAccountStakingRewards(accountKey);
    const pendingRewards = new PendingRewardsByTypeStruct();
    pendingRewards.pendingRewardsByType = rewardsByType;
    const totalPending = toBigIntValue(rewardsByType?.sponsorRewardsList?.stakingRewards) +
        toBigIntValue(rewardsByType?.recipientRewardsList?.stakingRewards) +
        toBigIntValue(rewardsByType?.agentRewardsList?.stakingRewards);
    return {
        pendingStakedRewards: [pendingRewards],
        totalPending,
    };
}
async function getShallowAccountRecord(runtime, accountKey) {
    const accountStruct = await runtime.spCoinSerialize.getAccountRecordObject(accountKey);
    accountStruct.accountKey = accountKey;
    const sponsorAccountKeys = Array.isArray(accountStruct.sponsorAccountList) ? accountStruct.sponsorAccountList : [];
    const parentRecipientKeys = Array.isArray(accountStruct.agentParentRecipientAccountList)
        ? accountStruct.agentParentRecipientAccountList
        : [];
    const pendingSummary = await getPendingRewardsSummary(runtime, accountKey);
    accountStruct.totalPending = pendingSummary.totalPending.toString();
    accountStruct.totalSpCoins = (toBigIntValue(accountStruct.balanceOf) +
        toBigIntValue(accountStruct.stakedBalance) +
        pendingSummary.totalPending).toString();
    accountStruct.parentSponsorList = sponsorAccountKeys;
    accountStruct.parentRecipientList = parentRecipientKeys;
    delete accountStruct.sponsorAccountList;
    accountStruct.recipientAccountList = [];
    accountStruct.agentAccountList = [];
    delete accountStruct.agentParentRecipientAccountList;
    accountStruct.pendingStakedRewards = pendingSummary.pendingStakedRewards;
    return accountStruct;
}
async function buildAccountRecord(runtime, accountKey, depthRemaining, visitedKeys) {
    const normalizedKey = String(accountKey ?? "").trim().toLowerCase();
    const nextVisitedKeys = new Set(visitedKeys || []);
    if (normalizedKey)
        nextVisitedKeys.add(normalizedKey);
    const accountStruct = await runtime.spCoinSerialize.getAccountRecordObject(accountKey);
    accountStruct.accountKey = accountKey;
    const sponsorAccountKeys = Array.isArray(accountStruct.sponsorAccountList) ? accountStruct.sponsorAccountList : [];
    const recipientAccountKeys = Array.isArray(accountStruct.recipientAccountList) ? accountStruct.recipientAccountList : [];
    const agentAccountKeys = Array.isArray(accountStruct.agentAccountList) ? accountStruct.agentAccountList : [];
    const parentRecipientKeys = Array.isArray(accountStruct.agentParentRecipientAccountList)
        ? accountStruct.agentParentRecipientAccountList
        : [];
    accountStruct.parentSponsorList = sponsorAccountKeys;
    accountStruct.parentRecipientList = parentRecipientKeys;
    delete accountStruct.sponsorAccountList;
    accountStruct.recipientAccountList = await buildRecipientAccountList(runtime, recipientAccountKeys, depthRemaining, nextVisitedKeys);
    accountStruct.agentAccountList = await buildAgentAccountList(runtime, agentAccountKeys, depthRemaining, nextVisitedKeys);
    delete accountStruct.agentParentRecipientAccountList;
    const pendingSummary = await getPendingRewardsSummary(runtime, accountKey);
    accountStruct.pendingStakedRewards = pendingSummary.pendingStakedRewards;
    const totalPending = pendingSummary.totalPending;
    accountStruct.totalPending = totalPending.toString();
    accountStruct.totalSpCoins = (toBigIntValue(accountStruct.balanceOf) +
        toBigIntValue(accountStruct.stakedBalance) +
        totalPending).toString();
    return accountStruct;
}
async function buildNestedAccountRecord(runtime, accountKey, depthRemaining, visitedKeys) {
    const normalizedKey = String(accountKey ?? "").trim().toLowerCase();
    if (!normalizedKey)
        return getShallowAccountRecord(runtime, accountKey);
    const activeVisitedKeys = new Set(visitedKeys || []);
    if (activeVisitedKeys.has(normalizedKey))
        return getShallowAccountRecord(runtime, accountKey);
    if (Number(depthRemaining) <= 0)
        return getShallowAccountRecord(runtime, accountKey);
    return buildAccountRecord(runtime, accountKey, Number(depthRemaining) - 1, activeVisitedKeys);
}
async function buildRecipientAccountList(runtime, recipientAccountKeys, depthRemaining, visitedKeys) {
    const recipientAccountList = [];
    for (const recipientKey of recipientAccountKeys || []) {
        const recipientAccount = await buildNestedAccountRecord(runtime, recipientKey, depthRemaining, visitedKeys);
        recipientAccountList.push(recipientAccount);
    }
    return recipientAccountList;
}
async function buildAgentAccountList(runtime, agentAccountKeys, depthRemaining, visitedKeys) {
    const agentAccountList = [];
    for (const agentKey of agentAccountKeys || []) {
        agentAccountList.push(await buildNestedAccountRecord(runtime, agentKey, depthRemaining, visitedKeys));
    }
    return agentAccountList;
}
export async function getAccountRecord(context, _accountKey) {
    const runtime = context;
    const accountStruct = await buildAccountRecord(runtime, _accountKey, 1, new Set());
    runtime.spCoinLogger.logExitFunction();
    return accountStruct;
}
