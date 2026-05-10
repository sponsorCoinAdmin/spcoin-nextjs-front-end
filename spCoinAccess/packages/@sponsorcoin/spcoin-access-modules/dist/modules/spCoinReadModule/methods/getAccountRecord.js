// @ts-nocheck
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
function buildTotalSpCoinsRecord(balanceOf, stakedBalance, pendingRewardsRecord, annualInflationRate = "0%") {
    const normalizedBalanceOf = String(balanceOf ?? "0");
    const normalizedStakedBalance = String(stakedBalance ?? "0");
    const normalizedPendingRewardsRecord = pendingRewardsRecord && typeof pendingRewardsRecord === "object"
        ? pendingRewardsRecord
        : buildPendingRewardsRecord();
    const normalizedPendingRewards = String(normalizedPendingRewardsRecord.pendingRewards ?? "0");
    return {
        totalSpCoins: (toBigIntValue(normalizedBalanceOf) +
            toBigIntValue(normalizedStakedBalance) +
            toBigIntValue(normalizedPendingRewards)).toString(),
        balanceOf: normalizedBalanceOf,
        stakedBalance: normalizedStakedBalance,
        annualInflationRate: String(annualInflationRate ?? "0%"),
        pendingRewards: normalizedPendingRewardsRecord,
    };
}
function buildPendingRewardsRecord(rewardsByType = undefined) {
    const pendingSponsorRewards = String(rewardsByType?.sponsorRewardsList?.stakingRewards ?? "0");
    const pendingRecipientRewards = String(rewardsByType?.recipientRewardsList?.stakingRewards ?? "0");
    const pendingAgentRewards = String(rewardsByType?.agentRewardsList?.stakingRewards ?? "0");
    return {
        pendingRewards: (toBigIntValue(pendingSponsorRewards) +
            toBigIntValue(pendingRecipientRewards) +
            toBigIntValue(pendingAgentRewards)).toString(),
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
    accountStruct.totalSpCoins = buildTotalSpCoinsRecord(accountStruct.balanceOf, accountStruct.stakedBalance, pendingSummary.pendingRewardsRecord, `${String(spCoinMetaData?.inflationRate ?? 0)}%`);
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
    accountStruct.totalSpCoins = buildTotalSpCoinsRecord(accountStruct.balanceOf, accountStruct.stakedBalance, pendingSummary.pendingRewardsRecord, `${String(spCoinMetaData?.inflationRate ?? 0)}%`);
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
    const debugState = createRelationshipBuildDebug(runtime, _accountKey);
    const accountStruct = await buildAccountRecord(runtime, _accountKey, 1, new Set(), debugState);
    debugState.logSummary("getAccountRecord");
    runtime.spCoinLogger.logExitFunction();
    return accountStruct;
}
