// @ts-nocheck
import { bigIntToDateTimeString, bigIntToDecString } from "../../../utils/dateTime";
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
function buildPendingRewardsAction(accountKey, action) {
    return {
        __lazyPendingRewardsAction: true,
        action,
        accountKey: String(accountKey ?? ""),
    };
}
function buildTotalSpCoinsRecord(balanceOf, stakedBalance, pendingRewardsRecord, annualInflationRate = "0%", accountKey = undefined) {
    const normalizedBalanceOf = String(balanceOf ?? "0");
    const normalizedStakedBalance = String(stakedBalance ?? "0");
    const normalizedPendingRewardsRecord = pendingRewardsRecord && typeof pendingRewardsRecord === "object"
        ? pendingRewardsRecord
        : buildPendingRewardsRecord(undefined, accountKey);
    const hasPendingRewards = Object.prototype.hasOwnProperty.call(normalizedPendingRewardsRecord, "pendingRewards");
    const hasPendingSponsorRewards = Object.prototype.hasOwnProperty.call(normalizedPendingRewardsRecord, "pendingSponsorRewards");
    const hasPendingRecipientRewards = Object.prototype.hasOwnProperty.call(normalizedPendingRewardsRecord, "pendingRecipientRewards");
    const hasPendingAgentRewards = Object.prototype.hasOwnProperty.call(normalizedPendingRewardsRecord, "pendingAgentRewards");
    const hasLastSponsorUpdate = Object.prototype.hasOwnProperty.call(normalizedPendingRewardsRecord, "lastSponsorUpdate");
    const hasLastRecipientUpdate = Object.prototype.hasOwnProperty.call(normalizedPendingRewardsRecord, "lastRecipientUpdate");
    const hasLastAgentUpdate = Object.prototype.hasOwnProperty.call(normalizedPendingRewardsRecord, "lastAgentUpdate");
    const normalizedPendingRewards = hasPendingRewards ? String(normalizedPendingRewardsRecord.pendingRewards ?? "0") : "0";
    const pendingRewardsDisplay = {
        TYPE: "--PENDING_REWARDS--",
        claim: buildPendingRewardsAction(accountKey, "claim"),
        estimate: buildPendingRewardsAction(accountKey, "estimate"),
        ...(hasPendingRewards ? { pendingRewards: normalizedPendingRewards } : {}),
        ...(hasLastSponsorUpdate ? { lastSponsorUpdate: String(normalizedPendingRewardsRecord.lastSponsorUpdate ?? "0") } : {}),
        ...(hasLastRecipientUpdate ? { lastRecipientUpdate: String(normalizedPendingRewardsRecord.lastRecipientUpdate ?? "0") } : {}),
        ...(hasLastAgentUpdate ? { lastAgentUpdate: String(normalizedPendingRewardsRecord.lastAgentUpdate ?? "0") } : {}),
        ...(hasPendingSponsorRewards ? { pendingSponsorRewards: String(normalizedPendingRewardsRecord.pendingSponsorRewards ?? "0") } : {}),
        ...(hasPendingRecipientRewards ? { pendingRecipientRewards: String(normalizedPendingRewardsRecord.pendingRecipientRewards ?? "0") } : {}),
        ...(hasPendingAgentRewards ? { pendingAgentRewards: String(normalizedPendingRewardsRecord.pendingAgentRewards ?? "0") } : {}),
    };
    return {
        TYPE: "--TOTAL_SP_COINS--",
        totalSpCoins: (toBigIntValue(normalizedBalanceOf) +
            toBigIntValue(normalizedStakedBalance) +
            toBigIntValue(normalizedPendingRewards)).toString(),
        balanceOf: normalizedBalanceOf,
        stakedBalance: normalizedStakedBalance,
        annualInflationRate: String(annualInflationRate ?? "0%"),
        pendingRewards: pendingRewardsDisplay,
    };
}
function buildPendingRewardsRecord(rewardsByType = undefined, accountKey = undefined, accountRecord = undefined) {
    const lastSponsorUpdate = String(rewardsByType?.lastSponsorUpdate ??
        accountRecord?.lastSponsorUpdate ??
        accountRecord?.lastSponsorUpdateTimeStamp ??
        "0");
    const lastRecipientUpdate = String(rewardsByType?.lastRecipientUpdate ??
        accountRecord?.lastRecipientUpdate ??
        accountRecord?.lastRecipientUpdateTimeStamp ??
        "0");
    const lastAgentUpdate = String(rewardsByType?.lastAgentUpdate ??
        accountRecord?.lastAgentUpdate ??
        accountRecord?.lastAgentUpdateTimeStamp ??
        "0");
    const hasRewardValues = Boolean(rewardsByType && typeof rewardsByType === "object");
    if (!hasRewardValues) {
        return {
            TYPE: "--PENDING_REWARDS--",
            claim: buildPendingRewardsAction(accountKey, "claim"),
            estimate: buildPendingRewardsAction(accountKey, "estimate"),
            lastSponsorUpdate,
            lastRecipientUpdate,
            lastAgentUpdate,
        };
    }
    const pendingSponsorRewards = String(rewardsByType?.pendingSponsorRewards ??
        rewardsByType?.sponsorRewardsList?.stakingRewards ??
        "0");
    const pendingRecipientRewards = String(rewardsByType?.pendingRecipientRewards ??
        rewardsByType?.recipientRewardsList?.stakingRewards ??
        "0");
    const pendingAgentRewards = String(rewardsByType?.pendingAgentRewards ??
        rewardsByType?.agentRewardsList?.stakingRewards ??
        "0");
    return {
        TYPE: "--PENDING_REWARDS--",
        pendingRewards: (toBigIntValue(pendingSponsorRewards) +
            toBigIntValue(pendingRecipientRewards) +
            toBigIntValue(pendingAgentRewards)).toString(),
        claim: buildPendingRewardsAction(accountKey, "claim"),
        estimate: buildPendingRewardsAction(accountKey, "estimate"),
        lastSponsorUpdate,
        lastRecipientUpdate,
        lastAgentUpdate,
        pendingSponsorRewards,
        pendingRecipientRewards,
        pendingAgentRewards,
    };
}
async function getRecipientTransactionFieldsCached(runtime, sponsorAccountKey, recipientAccountKey, recipientRateKey) {
    return await runtime.spCoinSerialize.getRecipientTransactionFields(sponsorAccountKey, recipientAccountKey, recipientRateKey);
}
async function getAgentTransactionFieldsCached(runtime, sponsorAccountKey, recipientAccountKey, recipientRateKey, agentAccountKey, agentRateKey) {
    return await runtime.spCoinSerialize.getAgentTransactionFields(sponsorAccountKey, recipientAccountKey, recipientRateKey, agentAccountKey, agentRateKey);
}
function mergeRateMaps(existingValue, incomingValue) {
    return {
        ...(existingValue && typeof existingValue === "object" ? existingValue : {}),
        ...(incomingValue && typeof incomingValue === "object" ? incomingValue : {}),
    };
}
function mergeAccountNode(existingAccount, incomingAccount) {
    if (!existingAccount)
        return incomingAccount;
    if (!incomingAccount)
        return existingAccount;
    return {
        ...existingAccount,
        ...incomingAccount,
        totalSpCoins: incomingAccount.totalSpCoins ?? existingAccount.totalSpCoins,
        recipientRateKeys: mergeRateMaps(existingAccount.recipientRateKeys, incomingAccount.recipientRateKeys),
        agentRateKeys: mergeRateMaps(existingAccount.agentRateKeys, incomingAccount.agentRateKeys),
        recipientAccountList: Array.isArray(incomingAccount.recipientAccountList) && incomingAccount.recipientAccountList.length > 0
            ? incomingAccount.recipientAccountList
            : existingAccount.recipientAccountList,
        agentAccountList: Array.isArray(incomingAccount.agentAccountList) && incomingAccount.agentAccountList.length > 0
            ? incomingAccount.agentAccountList
            : existingAccount.agentAccountList,
    };
}
function normalizeDisplayAddress(value) {
    return String(value ?? "").trim().toLowerCase();
}
async function getBaseAccountRecord(runtime, accountKey) {
    const readAccountRecord = runtime?.spCoinContractDeployed?.getAccountRecord;
    if (typeof readAccountRecord !== "function") {
        return getShallowAccountRecord(runtime, accountKey);
    }
    const record = await readAccountRecord(accountKey);
    const normalizedAccountKey = record?.accountKey ?? record?.[0] ?? accountKey;
    const creationTime = record?.creationTime ?? record?.[1] ?? 0;
    const accountBalance = record?.accountBalance ?? record?.balanceOf ?? record?.[2] ?? 0;
    const stakedAccountSPCoins = record?.stakedAccountSPCoins ?? record?.stakedBalance ?? record?.[3] ?? 0;
    const accountStakingRewards = record?.accountStakingRewards ?? record?.stakingRewards ?? record?.[4] ?? 0;
    const sponsorCount = record?.sponsorCount ?? record?.[5] ?? 0;
    const recipientCount = record?.recipientCount ?? record?.[6] ?? 0;
    const agentCount = record?.agentCount ?? record?.[7] ?? 0;
    const parentRecipientCount = record?.parentRecipientCount ?? record?.[8] ?? 0;
    const lastSponsorUpdateTimeStamp = record?.lastSponsorUpdateTimeStamp ?? record?.[9] ?? 0;
    const lastRecipientUpdateTimeStamp = record?.lastRecipientUpdateTimeStamp ?? record?.[10] ?? 0;
    const lastAgentUpdateTimeStamp = record?.lastAgentUpdateTimeStamp ?? record?.[11] ?? 0;
    return {
        TYPE: "--ACCOUNT--",
        accountKey: normalizeDisplayAddress(normalizedAccountKey),
        creationTime: String(creationTime).trim() === "0" ? "" : bigIntToDateTimeString(creationTime),
        totalSpCoins: buildTotalSpCoinsRecord(bigIntToDecString(accountBalance), bigIntToDecString(stakedAccountSPCoins), buildPendingRewardsRecord(undefined, accountKey, {
            lastSponsorUpdateTimeStamp,
            lastRecipientUpdateTimeStamp,
            lastAgentUpdateTimeStamp,
        }), "0%", accountKey),
        sponsorCount: String(sponsorCount),
        recipientCount: String(recipientCount),
        agentCount: String(agentCount),
        parentRecipientCount: String(parentRecipientCount),
        lastSponsorUpdateTimeStamp: String(lastSponsorUpdateTimeStamp ?? "0"),
        lastRecipientUpdateTimeStamp: String(lastRecipientUpdateTimeStamp ?? "0"),
        lastAgentUpdateTimeStamp: String(lastAgentUpdateTimeStamp ?? "0"),
        recipientKeys: [],
        recipientRates: {},
        agentKeys: [],
        agentRates: {},
        sponsorKeys: [],
        parentRecipientKeys: [],
        stakingRewards: bigIntToDecString(accountStakingRewards),
    };
}
async function getPendingRewardsSummary(runtime, accountKey) {
    const rewardsByType = await runtime.getAccountStakingRewards(accountKey);
    const totalPending = toBigIntValue(rewardsByType?.sponsorRewardsList?.stakingRewards) +
        toBigIntValue(rewardsByType?.recipientRewardsList?.stakingRewards) +
        toBigIntValue(rewardsByType?.agentRewardsList?.stakingRewards);
    return {
        pendingRewardsRecord: buildPendingRewardsRecord(rewardsByType),
        totalPending,
    };
}
async function getSpCoinMetaDataCached(runtime) {
    if (!runtime.__spCoinMetaDataCache) {
        runtime.__spCoinMetaDataCache = runtime.getSpCoinMetaData();
    }
    return await runtime.__spCoinMetaDataCache;
}
function createRelationshipBuildDebug(runtime, rootAccountKey) {
    return {
        rootAccountKey: String(rootAccountKey ?? ""),
        accountRecordReads: 0,
        recipientRateReads: 0,
        recipientAgentReads: 0,
        agentRateReads: 0,
        startedAt: Date.now(),
        logSummary(label) {
            runtime?.spCoinLogger?.logDetail?.(`JS => ${label} relationship build summary root=${this.rootAccountKey} accountReads=${String(this.accountRecordReads)} recipientRateReads=${String(this.recipientRateReads)} recipientAgentReads=${String(this.recipientAgentReads)} agentRateReads=${String(this.agentRateReads)} durationMs=${String(Date.now() - this.startedAt)}`);
        },
    };
}
function buildAgentParentRelationshipRecord(sponsorAccountKey, recipientAccountKey, recipientRateKey, agentAccountKey, agentRateKey) {
    return {
        agentRateKey: String(agentRateKey ?? ""),
        stakedAmount: String(recipientAccountKey ?? "0"),
    };
}
function buildAgentRateRelationshipRecord(relationship) {
    return {
        stakedAmount: String(relationship?.stakedAmount ?? "0"),
    };
}
function toAgentRateKeysRecord(relationships) {
    const agentRates = {};
    for (const relationship of Array.isArray(relationships) ? relationships : []) {
        const agentRateKey = String(relationship?.agentRateKey ?? "");
        if (!agentRateKey)
            continue;
        agentRates[agentRateKey] = buildAgentRateRelationshipRecord(relationship);
    }
    return agentRates;
}
async function getAgentParentRelationshipsForRecipient(runtime, sponsorAccountKey, recipientAccountKey, agentAccountKey, debugState) {
    const relationships = [];
    if (debugState)
        debugState.recipientRateReads += 1;
    const recipientRateKeys = await runtime.getRecipientRateList(sponsorAccountKey, recipientAccountKey);
    for (const recipientRateKey of Array.isArray(recipientRateKeys) ? recipientRateKeys : []) {
        if (debugState)
            debugState.recipientAgentReads += 1;
        const agentAccountKeys = await runtime.getRecipientRateAgentList(sponsorAccountKey, recipientAccountKey, recipientRateKey);
        for (const candidateAgentKey of Array.isArray(agentAccountKeys) ? agentAccountKeys : []) {
            if (String(candidateAgentKey ?? "").trim().toLowerCase() !== String(agentAccountKey ?? "").trim().toLowerCase())
                continue;
            if (debugState)
                debugState.agentRateReads += 1;
            const agentRateKeys = await runtime.getAgentRateList(sponsorAccountKey, recipientAccountKey, recipientRateKey, agentAccountKey);
            for (const agentRateKey of Array.isArray(agentRateKeys) ? agentRateKeys : []) {
                const agentTransactionFields = await getAgentTransactionFieldsCached(runtime, sponsorAccountKey, recipientAccountKey, recipientRateKey, agentAccountKey, agentRateKey);
                relationships.push(buildAgentParentRelationshipRecord(sponsorAccountKey, agentTransactionFields?.[2] ?? "0", recipientRateKey, agentAccountKey, agentRateKey));
            }
        }
    }
    return relationships;
}
async function buildAgentParentRelationshipList(runtime, agentAccountKey, parentRecipientKeys, debugState) {
    const relationshipList = [];
    for (const recipientAccountKey of Array.isArray(parentRecipientKeys) ? parentRecipientKeys : []) {
        if (debugState)
            debugState.accountRecordReads += 1;
        const recipientAccount = await runtime.spCoinSerialize.getAccountRecordObject(recipientAccountKey);
        const sponsorAccountKeys = Array.isArray(recipientAccount?.sponsorAccountList) ? recipientAccount.sponsorAccountList : [];
        for (const sponsorAccountKey of sponsorAccountKeys) {
            const relationships = await getAgentParentRelationshipsForRecipient(runtime, sponsorAccountKey, recipientAccountKey, agentAccountKey, debugState);
            relationshipList.push(...relationships);
        }
    }
    return relationshipList;
}
async function buildRecipientRateRelationshipList(runtime, sponsorAccountKey, recipientAccountKey, debugState) {
    if (!String(sponsorAccountKey ?? "").trim() || !String(recipientAccountKey ?? "").trim()) {
        return {};
    }
    try {
        if (debugState)
            debugState.recipientRateReads += 1;
        const recipientRateKeys = await runtime.getRecipientRateList(sponsorAccountKey, recipientAccountKey);
        const recipientRateKeysRecord = {};
        for (const recipientRateKey of Array.isArray(recipientRateKeys) ? recipientRateKeys : []) {
            const recipientTransactionFields = await getRecipientTransactionFieldsCached(runtime, sponsorAccountKey, recipientAccountKey, recipientRateKey);
            if (debugState)
                debugState.recipientAgentReads += 1;
            const agentAccountKeys = await runtime.getRecipientRateAgentList(sponsorAccountKey, recipientAccountKey, recipientRateKey);
            const agentAccountList = [];
            for (const agentAccountKey of Array.isArray(agentAccountKeys) ? agentAccountKeys : []) {
                if (debugState)
                    debugState.agentRateReads += 1;
                const agentRateKeys = await runtime.getAgentRateList(sponsorAccountKey, recipientAccountKey, recipientRateKey, agentAccountKey);
                const agentAccount = await getShallowAccountRecord(runtime, agentAccountKey);
                const agentRelationships = [];
                for (const agentRateKey of Array.isArray(agentRateKeys) ? agentRateKeys : []) {
                    const agentTransactionFields = await getAgentTransactionFieldsCached(runtime, sponsorAccountKey, recipientAccountKey, recipientRateKey, agentAccountKey, agentRateKey);
                    agentRelationships.push(buildAgentParentRelationshipRecord(sponsorAccountKey, agentTransactionFields?.[2] ?? "0", recipientRateKey, agentAccountKey, agentRateKey));
                }
                agentAccount.agentRateKeys = toAgentRateKeysRecord(agentRelationships);
                agentAccountList.push(agentAccount);
            }
            recipientRateKeysRecord[String(recipientRateKey ?? "")] = {
                stakedAmount: String(recipientTransactionFields?.[2] ?? "0"),
                agentAccountList,
            };
        }
        return recipientRateKeysRecord;
    }
    catch (error) {
        runtime?.spCoinLogger?.logDetail?.(`JS => buildRecipientRateRelationshipList soft-failed sponsor=${String(sponsorAccountKey ?? "")} recipient=${String(recipientAccountKey ?? "")}: ${String(error?.message || error)}`);
        return {};
    }
}
async function getShallowAccountRecord(runtime, accountKey) {
    const accountStruct = await runtime.spCoinSerialize.getAccountRecordObject(accountKey);
    delete accountStruct.TYPE;
    accountStruct.accountKey = accountKey;
    const pendingSummary = await getPendingRewardsSummary(runtime, accountKey);
    const spCoinMetaData = await getSpCoinMetaDataCached(runtime);
    accountStruct.totalSpCoins = buildTotalSpCoinsRecord(accountStruct.balanceOf, accountStruct.stakedBalance, pendingSummary.pendingRewardsRecord, `${String(spCoinMetaData?.inflationRate ?? 0)}%`, accountKey);
    delete accountStruct.balanceOf;
    delete accountStruct.stakedBalance;
    accountStruct.agentRateKeys = {};
    delete accountStruct.sponsorAccountList;
    accountStruct.recipientAccountList = [];
    accountStruct.recipientRateKeys = {};
    accountStruct.agentAccountList = [];
    delete accountStruct.agentParentRecipientAccountList;
    return accountStruct;
}
async function buildAccountRecord(runtime, accountKey, depthRemaining, visitedKeys, debugState) {
    const normalizedKey = String(accountKey ?? "").trim().toLowerCase();
    const nextVisitedKeys = new Set(visitedKeys || []);
    if (normalizedKey)
        nextVisitedKeys.add(normalizedKey);
    if (debugState)
        debugState.accountRecordReads += 1;
    const accountStruct = await runtime.spCoinSerialize.getAccountRecordObject(accountKey);
    delete accountStruct.TYPE;
    accountStruct.accountKey = accountKey;
    const sponsorAccountKeys = Array.isArray(accountStruct.sponsorAccountList) ? accountStruct.sponsorAccountList : [];
    const recipientAccountKeys = Array.isArray(accountStruct.recipientAccountList) ? accountStruct.recipientAccountList : [];
    const parentRecipientKeys = Array.isArray(accountStruct.agentParentRecipientAccountList)
        ? accountStruct.agentParentRecipientAccountList
        : [];
    try {
        accountStruct.agentRateKeys = toAgentRateKeysRecord(await buildAgentParentRelationshipList(runtime, accountKey, parentRecipientKeys, debugState));
    }
    catch (error) {
        accountStruct.agentRateKeys = {};
        runtime?.spCoinLogger?.logDetail?.(`JS => buildAgentParentRelationshipList soft-failed for ${String(accountKey ?? "")}: ${String(error?.message || error)}`);
    }
    delete accountStruct.sponsorAccountList;
    accountStruct.recipientRateKeys = {};
    accountStruct.recipientAccountList = await buildRecipientAccountList(runtime, accountKey, recipientAccountKeys, depthRemaining, nextVisitedKeys, debugState);
    accountStruct.agentAccountList = sponsorAccountKeys.length > 0
        ? await buildAgentAccountListForRecipient(runtime, sponsorAccountKeys, accountKey, depthRemaining, nextVisitedKeys, debugState)
        : [];
    delete accountStruct.agentParentRecipientAccountList;
    const pendingSummary = await getPendingRewardsSummary(runtime, accountKey);
    const spCoinMetaData = await getSpCoinMetaDataCached(runtime);
    accountStruct.totalSpCoins = buildTotalSpCoinsRecord(accountStruct.balanceOf, accountStruct.stakedBalance, pendingSummary.pendingRewardsRecord, `${String(spCoinMetaData?.inflationRate ?? 0)}%`, accountKey);
    delete accountStruct.balanceOf;
    delete accountStruct.stakedBalance;
    return accountStruct;
}
async function buildNestedAccountRecord(runtime, accountKey, depthRemaining, visitedKeys, debugState) {
    const normalizedKey = String(accountKey ?? "").trim().toLowerCase();
    if (!normalizedKey)
        return getShallowAccountRecord(runtime, accountKey);
    const activeVisitedKeys = new Set(visitedKeys || []);
    if (activeVisitedKeys.has(normalizedKey))
        return getShallowAccountRecord(runtime, accountKey);
    if (Number(depthRemaining) <= 0)
        return getShallowAccountRecord(runtime, accountKey);
    return buildAccountRecord(runtime, accountKey, Number(depthRemaining) - 1, activeVisitedKeys, debugState);
}
async function buildRecipientAccountList(runtime, sponsorAccountKey, recipientAccountKeys, depthRemaining, visitedKeys, debugState) {
    const recipientAccountList = [];
    const recipientAccountMap = new Map();
    for (const recipientKey of recipientAccountKeys || []) {
        const recipientAccount = await buildNestedAccountRecord(runtime, recipientKey, depthRemaining, visitedKeys, debugState);
        recipientAccount.recipientRateKeys = await buildRecipientRateRelationshipList(runtime, sponsorAccountKey, recipientKey, debugState);
        recipientAccount.agentAccountList = [];
        recipientAccountMap.set(String(recipientKey ?? "").trim().toLowerCase(), mergeAccountNode(recipientAccountMap.get(String(recipientKey ?? "").trim().toLowerCase()), recipientAccount));
    }
    recipientAccountList.push(...Array.from(recipientAccountMap.values()));
    return recipientAccountList;
}
async function buildAgentAccountListForRecipient(runtime, sponsorAccountKeys, recipientAccountKey, depthRemaining, visitedKeys, debugState) {
    const agentAccountList = [];
    for (const sponsorAccountKey of Array.isArray(sponsorAccountKeys) ? sponsorAccountKeys : []) {
        if (debugState)
            debugState.recipientRateReads += 1;
        const recipientRateKeys = await runtime.getRecipientRateList(sponsorAccountKey, recipientAccountKey);
        for (const recipientRateKey of Array.isArray(recipientRateKeys) ? recipientRateKeys : []) {
            if (debugState)
                debugState.recipientAgentReads += 1;
            const agentAccountKeys = await runtime.getRecipientRateAgentList(sponsorAccountKey, recipientAccountKey, recipientRateKey);
            for (const agentAccountKey of Array.isArray(agentAccountKeys) ? agentAccountKeys : []) {
                if (debugState)
                    debugState.agentRateReads += 1;
                const agentRateKeys = await runtime.getAgentRateList(sponsorAccountKey, recipientAccountKey, recipientRateKey, agentAccountKey);
                for (const agentRateKey of Array.isArray(agentRateKeys) ? agentRateKeys : []) {
                    const agentAccount = await buildNestedAccountRecord(runtime, agentAccountKey, depthRemaining, visitedKeys, debugState);
                    agentAccount.agentRateKeys = toAgentRateKeysRecord([
                        buildAgentParentRelationshipRecord(sponsorAccountKey, (await getAgentTransactionFieldsCached(runtime, sponsorAccountKey, recipientAccountKey, recipientRateKey, agentAccountKey, agentRateKey))?.[2] ?? "0", recipientRateKey, agentAccountKey, agentRateKey),
                    ]);
                    agentAccountList.push(agentAccount);
                }
            }
        }
    }
    return agentAccountList;
}
export async function getAccountRecord(context, _accountKey) {
    const runtime = context;
    const accountStruct = await getBaseAccountRecord(runtime, _accountKey);
    runtime.spCoinLogger.logExitFunction();
    return accountStruct;
}
