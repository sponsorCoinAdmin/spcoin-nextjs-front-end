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
    const pendingSummary = await getPendingRewardsSummary(runtime, accountKey);
    accountStruct.totalPending = pendingSummary.totalPending.toString();
    accountStruct.totalSpCoins = (toBigIntValue(accountStruct.balanceOf) +
        toBigIntValue(accountStruct.stakedBalance) +
        pendingSummary.totalPending).toString();
    accountStruct.sponsorAccountList = [];
    accountStruct.recipientAccountList = [];
    accountStruct.agentAccountList = [];
    accountStruct.agentParentRecipientAccountList = [];
    accountStruct.pendingStakedRewards = pendingSummary.pendingStakedRewards;
    return accountStruct;
}

async function buildSponsorAccountList(runtime, sponsorAccountKeys) {
    const sponsorAccountList = [];
    for (const sponsorKey of sponsorAccountKeys || []) {
        sponsorAccountList.push(await getShallowAccountRecord(runtime, sponsorKey));
    }
    return sponsorAccountList;
}

async function buildRecipientAccountList(runtime, sponsorKey, recipientAccountKeys) {
    const recipientAccountList = [];
    for (const recipientKey of recipientAccountKeys || []) {
        const recipientAccount = await getShallowAccountRecord(runtime, recipientKey);
        recipientAccountList.push(recipientAccount);
    }
    return recipientAccountList;
}

async function buildAgentAccountList(runtime, agentAccountKeys) {
    const agentAccountList = [];
    for (const agentKey of agentAccountKeys || []) {
        agentAccountList.push(await getShallowAccountRecord(runtime, agentKey));
    }
    return agentAccountList;
}

export async function getAccountRecord(context, _accountKey) {
    const runtime = context;
    const accountStruct = await runtime.spCoinSerialize.getAccountRecordObject(_accountKey);
    accountStruct.accountKey = _accountKey;
    const sponsorAccountKeys = Array.isArray(accountStruct.sponsorAccountList) ? accountStruct.sponsorAccountList : [];
    const recipientAccountKeys = Array.isArray(accountStruct.recipientAccountList) ? accountStruct.recipientAccountList : [];
    const agentAccountKeys = Array.isArray(accountStruct.agentAccountList) ? accountStruct.agentAccountList : [];
    accountStruct.sponsorAccountList = await buildSponsorAccountList(runtime, sponsorAccountKeys);
    accountStruct.recipientAccountList = await buildRecipientAccountList(runtime, _accountKey, recipientAccountKeys);
    accountStruct.agentAccountList = await buildAgentAccountList(runtime, agentAccountKeys);
    const pendingSummary = await getPendingRewardsSummary(runtime, _accountKey);
    accountStruct.pendingStakedRewards = pendingSummary.pendingStakedRewards;
    const totalPending = pendingSummary.totalPending;
    accountStruct.totalPending = totalPending.toString();
    accountStruct.totalSpCoins = (toBigIntValue(accountStruct.balanceOf) +
        toBigIntValue(accountStruct.stakedBalance) +
        totalPending).toString();
    runtime.spCoinLogger.logExitFunction();
    return accountStruct;
}

