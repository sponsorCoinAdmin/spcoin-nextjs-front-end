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

function buildTotalSpCoinsRecord(balanceOf, stakedBalance, pendingRewardsRecord) {
    const normalizedBalanceOf = String(balanceOf ?? "0");
    const normalizedStakedBalance = String(stakedBalance ?? "0");
    const normalizedPendingRewardsRecord =
        pendingRewardsRecord && typeof pendingRewardsRecord === "object"
            ? pendingRewardsRecord
            : buildPendingRewardsRecord();
    const normalizedPendingRewards = String(normalizedPendingRewardsRecord.pendingRewards ?? "0");
    return {
        totalSpCoins: (
            toBigIntValue(normalizedBalanceOf) +
            toBigIntValue(normalizedStakedBalance) +
            toBigIntValue(normalizedPendingRewards)
        ).toString(),
        balanceOf: normalizedBalanceOf,
        stakedBalance: normalizedStakedBalance,
        pendingRewards: normalizedPendingRewardsRecord,
    };
}

function buildPendingRewardsRecord(rewardsByType = undefined) {
    const pendingSponsorRewards = String(rewardsByType?.sponsorRewardsList?.stakingRewards ?? "0");
    const pendingRecipientRewards = String(rewardsByType?.recipientRewardsList?.stakingRewards ?? "0");
    const pendingAgentRewards = String(rewardsByType?.agentRewardsList?.stakingRewards ?? "0");
    return {
        pendingRewards:
            (
                toBigIntValue(pendingSponsorRewards) +
                toBigIntValue(pendingRecipientRewards) +
                toBigIntValue(pendingAgentRewards)
            ).toString(),
        pendingSponsorRewards,
        pendingRecipientRewards,
        pendingAgentRewards,
    };
}

function mergeBranchMaps(existingValue, incomingValue) {
    return {
        ...(existingValue && typeof existingValue === "object" ? existingValue : {}),
        ...(incomingValue && typeof incomingValue === "object" ? incomingValue : {}),
    };
}

function mergeAccountNode(existingAccount, incomingAccount) {
    if (!existingAccount) return incomingAccount;
    if (!incomingAccount) return existingAccount;
    return {
        ...existingAccount,
        ...incomingAccount,
        totalSpCoins: incomingAccount.totalSpCoins ?? existingAccount.totalSpCoins,
        recipientRateBranches: mergeBranchMaps(existingAccount.recipientRateBranches, incomingAccount.recipientRateBranches),
        agentRateBranches: mergeBranchMaps(existingAccount.agentRateBranches, incomingAccount.agentRateBranches),
        recipientAccountList: Array.isArray(incomingAccount.recipientAccountList) && incomingAccount.recipientAccountList.length > 0
            ? incomingAccount.recipientAccountList
            : existingAccount.recipientAccountList,
        agentAccountList: Array.isArray(incomingAccount.agentAccountList) && incomingAccount.agentAccountList.length > 0
            ? incomingAccount.agentAccountList
            : existingAccount.agentAccountList,
    };
}

function getRelationshipReadCache(runtime) {
    if (!runtime.__relationshipReadCache) {
        runtime.__relationshipReadCache = {
            accountRecordObject: new Map(),
            recipientRateList: new Map(),
            recipientRateAgentList: new Map(),
            agentRateList: new Map(),
            recipientRateRecordFields: new Map(),
            agentRateRecordFields: new Map(),
            pendingRewardsSummary: new Map(),
        };
    }
    return runtime.__relationshipReadCache;
}

async function getAccountRecordObjectCached(runtime, accountKey) {
    const cache = getRelationshipReadCache(runtime);
    const key = String(accountKey ?? "").trim().toLowerCase();
    if (!cache.accountRecordObject.has(key)) {
        cache.accountRecordObject.set(key, runtime.spCoinSerialize.getAccountRecordObject(accountKey));
    }
    return await cache.accountRecordObject.get(key);
}

async function getRecipientRateListCached(runtime, sponsorAccountKey, recipientAccountKey) {
    const cache = getRelationshipReadCache(runtime);
    const key = `${String(sponsorAccountKey ?? "").trim().toLowerCase()}|${String(recipientAccountKey ?? "").trim().toLowerCase()}`;
    if (!cache.recipientRateList.has(key)) {
        cache.recipientRateList.set(key, runtime.getRecipientRateList(sponsorAccountKey, recipientAccountKey));
    }
    return await cache.recipientRateList.get(key);
}

async function getRecipientRateAgentListCached(runtime, sponsorAccountKey, recipientAccountKey, recipientRateKey) {
    const cache = getRelationshipReadCache(runtime);
    const key = `${String(sponsorAccountKey ?? "").trim().toLowerCase()}|${String(recipientAccountKey ?? "").trim().toLowerCase()}|${String(recipientRateKey ?? "")}`;
    if (!cache.recipientRateAgentList.has(key)) {
        cache.recipientRateAgentList.set(
            key,
            runtime.getRecipientRateAgentList(sponsorAccountKey, recipientAccountKey, recipientRateKey),
        );
    }
    return await cache.recipientRateAgentList.get(key);
}

async function getAgentRateListCached(runtime, sponsorAccountKey, recipientAccountKey, recipientRateKey, agentAccountKey) {
    const cache = getRelationshipReadCache(runtime);
    const key = `${String(sponsorAccountKey ?? "").trim().toLowerCase()}|${String(recipientAccountKey ?? "").trim().toLowerCase()}|${String(recipientRateKey ?? "")}|${String(agentAccountKey ?? "").trim().toLowerCase()}`;
    if (!cache.agentRateList.has(key)) {
        cache.agentRateList.set(
            key,
            runtime.getAgentRateList(sponsorAccountKey, recipientAccountKey, recipientRateKey, agentAccountKey),
        );
    }
    return await cache.agentRateList.get(key);
}

async function getRecipientRateRecordFieldsCached(runtime, sponsorAccountKey, recipientAccountKey, recipientRateKey) {
    const cache = getRelationshipReadCache(runtime);
    const key = `${String(sponsorAccountKey ?? "").trim().toLowerCase()}|${String(recipientAccountKey ?? "").trim().toLowerCase()}|${String(recipientRateKey ?? "")}`;
    if (!cache.recipientRateRecordFields.has(key)) {
        cache.recipientRateRecordFields.set(
            key,
            runtime.spCoinSerialize.getRecipientRateRecordFields(sponsorAccountKey, recipientAccountKey, recipientRateKey),
        );
    }
    return await cache.recipientRateRecordFields.get(key);
}

async function getAgentRateRecordFieldsCached(runtime, sponsorAccountKey, recipientAccountKey, recipientRateKey, agentAccountKey, agentRateKey) {
    const cache = getRelationshipReadCache(runtime);
    const key = `${String(sponsorAccountKey ?? "").trim().toLowerCase()}|${String(recipientAccountKey ?? "").trim().toLowerCase()}|${String(recipientRateKey ?? "")}|${String(agentAccountKey ?? "").trim().toLowerCase()}|${String(agentRateKey ?? "")}`;
    if (!cache.agentRateRecordFields.has(key)) {
        cache.agentRateRecordFields.set(
            key,
            runtime.spCoinSerialize.getAgentRateRecordFields(sponsorAccountKey, recipientAccountKey, recipientRateKey, agentAccountKey, agentRateKey),
        );
    }
    return await cache.agentRateRecordFields.get(key);
}

async function getPendingRewardsSummary(runtime, accountKey) {
    const cache = getRelationshipReadCache(runtime);
    const key = String(accountKey ?? "").trim().toLowerCase();
    if (cache.pendingRewardsSummary.has(key)) {
        return await cache.pendingRewardsSummary.get(key);
    }
    const summaryPromise = (async () => {
        const rewardsByType = await runtime.getAccountStakingRewards(accountKey);
        const totalPending = toBigIntValue(rewardsByType?.sponsorRewardsList?.stakingRewards) +
            toBigIntValue(rewardsByType?.recipientRewardsList?.stakingRewards) +
            toBigIntValue(rewardsByType?.agentRewardsList?.stakingRewards);
        return {
            pendingRewardsRecord: buildPendingRewardsRecord(rewardsByType),
            totalPending,
        };
    })();
    cache.pendingRewardsSummary.set(key, summaryPromise);
    return await summaryPromise;
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
            runtime?.spCoinLogger?.logDetail?.(
                `JS => ${label} relationship build summary root=${this.rootAccountKey} accountReads=${String(this.accountRecordReads)} recipientRateReads=${String(this.recipientRateReads)} recipientAgentReads=${String(this.recipientAgentReads)} agentRateReads=${String(this.agentRateReads)} durationMs=${String(Date.now() - this.startedAt)}`,
            );
        },
    };
}

function buildAgentParentRelationshipRecord(agentRateKey, stakedAmount) {
    return {
        agentRateKey: String(agentRateKey ?? ""),
        stakedAmount: String(stakedAmount ?? "0"),
    };
}

function buildAgentRateRelationshipRecord(relationship) {
    return {
        stakedAmount: String(relationship?.stakedAmount ?? "0"),
    };
}

function toAgentRateKeysRecord(relationships) {
    const agentRateBranches = {};
    for (const relationship of Array.isArray(relationships) ? relationships : []) {
        const agentRateKey = String(relationship?.agentRateKey ?? "");
        if (!agentRateKey) continue;
        agentRateBranches[agentRateKey] = buildAgentRateRelationshipRecord(relationship);
    }
    return agentRateBranches;
}

async function getAgentParentRelationshipsForRecipient(runtime, sponsorAccountKey, recipientAccountKey, agentAccountKey, debugState) {
    const relationships = [];
    if (debugState) debugState.recipientRateReads += 1;
    const recipientRateKeys = await getRecipientRateListCached(runtime, sponsorAccountKey, recipientAccountKey);
    for (const recipientRateKey of Array.from(new Set(Array.isArray(recipientRateKeys) ? recipientRateKeys.map((value) => String(value ?? "")) : []))) {
        if (debugState) debugState.recipientAgentReads += 1;
        const agentAccountKeys = await getRecipientRateAgentListCached(
            runtime,
            sponsorAccountKey,
            recipientAccountKey,
            recipientRateKey,
        );
        for (const candidateAgentKey of Array.from(new Set(Array.isArray(agentAccountKeys) ? agentAccountKeys.map((value) => String(value ?? "")) : []))) {
            if (String(candidateAgentKey ?? "").trim().toLowerCase() !== String(agentAccountKey ?? "").trim().toLowerCase()) continue;
            if (debugState) debugState.agentRateReads += 1;
            const agentRateKeys = await getAgentRateListCached(
                runtime,
                sponsorAccountKey,
                recipientAccountKey,
                recipientRateKey,
                agentAccountKey,
            );
            for (const agentRateKey of Array.isArray(agentRateKeys) ? agentRateKeys : []) {
                const agentRateRecordFields = await getAgentRateRecordFieldsCached(
                    runtime,
                    sponsorAccountKey,
                    recipientAccountKey,
                    recipientRateKey,
                    agentAccountKey,
                    agentRateKey,
                );
                relationships.push(
                    buildAgentParentRelationshipRecord(
                        agentRateKey,
                        agentRateRecordFields?.[2] ?? "0",
                    ),
                );
            }
        }
    }
    return relationships;
}

async function buildAgentParentRelationshipList(runtime, agentAccountKey, parentRecipientKeys, debugState) {
    const relationshipList = [];
    const uniqueParentRecipientKeys = Array.from(new Set(Array.isArray(parentRecipientKeys) ? parentRecipientKeys.map((value) => String(value ?? "").trim().toLowerCase()) : []));
    for (const recipientAccountKey of uniqueParentRecipientKeys) {
        if (debugState) debugState.accountRecordReads += 1;
        const recipientAccount = await getAccountRecordObjectCached(runtime, recipientAccountKey);
        const sponsorAccountKeys = Array.from(new Set(Array.isArray(recipientAccount?.sponsorAccountList) ? recipientAccount.sponsorAccountList.map((value) => String(value ?? "").trim().toLowerCase()) : []));
        for (const sponsorAccountKey of sponsorAccountKeys) {
            const relationships = await getAgentParentRelationshipsForRecipient(
                runtime,
                sponsorAccountKey,
                recipientAccountKey,
                agentAccountKey,
                debugState,
            );
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
        if (debugState) debugState.recipientRateReads += 1;
        const recipientRateList = await getRecipientRateListCached(runtime, sponsorAccountKey, recipientAccountKey);
        const recipientRateBranches = {};
        for (const recipientRateKey of Array.from(new Set(Array.isArray(recipientRateList) ? recipientRateList.map((value) => String(value ?? "")) : []))) {
            const recipientRateRecordFields = await getRecipientRateRecordFieldsCached(
                runtime,
                sponsorAccountKey,
                recipientAccountKey,
                recipientRateKey,
            );
            if (debugState) debugState.recipientAgentReads += 1;
            const agentAccountKeys = await getRecipientRateAgentListCached(
                runtime,
                sponsorAccountKey,
                recipientAccountKey,
                recipientRateKey,
            );
            const agentAccountMap = new Map();
            for (const agentAccountKey of Array.from(new Set(Array.isArray(agentAccountKeys) ? agentAccountKeys.map((value) => String(value ?? "").trim().toLowerCase()) : []))) {
                if (debugState) debugState.agentRateReads += 1;
                const agentRateKeys = await getAgentRateListCached(
                    runtime,
                    sponsorAccountKey,
                    recipientAccountKey,
                    recipientRateKey,
                    agentAccountKey,
                );
                const agentAccount = await getShallowAccountRecord(runtime, agentAccountKey);
                const agentRelationships = (Array.isArray(agentRateKeys) ? Array.from(new Set(agentRateKeys.map((value) => String(value ?? "")))) : []).map((agentRateKey) =>
                    buildAgentParentRelationshipRecord(agentRateKey));
                for (const relationship of agentRelationships) {
                    relationship.stakedAmount = String(
                        (
                            await getAgentRateRecordFieldsCached(
                                runtime,
                                sponsorAccountKey,
                                recipientAccountKey,
                                recipientRateKey,
                                agentAccountKey,
                                relationship.agentRateKey,
                            )
                        )?.[2] ?? "0",
                    );
                }
                agentAccount.agentRateBranches = toAgentRateKeysRecord(agentRelationships);
                agentAccountMap.set(
                    agentAccountKey,
                    mergeAccountNode(agentAccountMap.get(agentAccountKey), agentAccount),
                );
            }
            recipientRateBranches[String(recipientRateKey ?? "")] = {
                stakedAmount: String(recipientRateRecordFields?.[2] ?? "0"),
                agentAccountList: Array.from(agentAccountMap.values()),
            };
        }
        return recipientRateBranches;
    }
    catch (error) {
        runtime?.spCoinLogger?.logDetail?.(
            `JS => buildRecipientRateRelationshipList soft-failed sponsor=${String(sponsorAccountKey ?? "")} recipient=${String(recipientAccountKey ?? "")}: ${String(error?.message || error)}`,
        );
        return {};
    }
}

function normalizeDisplayAddress(value) {
    return String(value ?? "").trim().toLowerCase();
}

async function getShallowAccountRecord(runtime, accountKey) {
    const baseAccountStruct = await getAccountRecordObjectCached(runtime, accountKey);
    const accountStruct = { ...(baseAccountStruct || {}) };
    delete accountStruct.TYPE;
    accountStruct.accountKey = normalizeDisplayAddress(accountKey);
    delete accountStruct.verified;
    const pendingSummary = await getPendingRewardsSummary(runtime, accountKey);
    accountStruct.totalSpCoins = buildTotalSpCoinsRecord(
        accountStruct.balanceOf,
        accountStruct.stakedBalance,
        pendingSummary.pendingRewardsRecord,
    );
    delete accountStruct.balanceOf;
    delete accountStruct.stakedBalance;
    accountStruct.agentRateBranches = {};
    delete accountStruct.sponsorAccountList;
    accountStruct.recipientAccountList = [];
    accountStruct.recipientRateBranches = {};
    accountStruct.agentAccountList = [];
    delete accountStruct.agentParentRecipientAccountList;
    return accountStruct;
}

async function buildAccountRecord(runtime, accountKey, depthRemaining, visitedKeys, debugState) {
    const normalizedKey = String(accountKey ?? "").trim().toLowerCase();
    const nextVisitedKeys = new Set(visitedKeys || []);
    if (normalizedKey)
        nextVisitedKeys.add(normalizedKey);
    if (debugState) debugState.accountRecordReads += 1;
    const baseAccountStruct = await getAccountRecordObjectCached(runtime, accountKey);
    const accountStruct = { ...(baseAccountStruct || {}) };
    delete accountStruct.TYPE;
    accountStruct.accountKey = normalizeDisplayAddress(accountKey);
    delete accountStruct.verified;
    const sponsorAccountKeys = Array.isArray(accountStruct.sponsorAccountList) ? accountStruct.sponsorAccountList : [];
    const recipientAccountKeys = Array.isArray(accountStruct.recipientAccountList) ? accountStruct.recipientAccountList : [];
    const parentRecipientKeys = Array.isArray(accountStruct.agentParentRecipientAccountList)
        ? accountStruct.agentParentRecipientAccountList
        : [];
    try {
        accountStruct.agentRateBranches = toAgentRateKeysRecord(
            await buildAgentParentRelationshipList(runtime, accountKey, parentRecipientKeys, debugState),
        );
    }
    catch (error) {
        accountStruct.agentRateBranches = {};
        runtime?.spCoinLogger?.logDetail?.(
            `JS => buildAgentParentRelationshipList soft-failed for ${String(accountKey ?? "")}: ${String(error?.message || error)}`,
        );
    }
    delete accountStruct.sponsorAccountList;
    accountStruct.recipientRateBranches = {};
    accountStruct.recipientAccountList = await buildRecipientAccountList(runtime, accountKey, recipientAccountKeys, depthRemaining, nextVisitedKeys, debugState);
    accountStruct.agentAccountList = sponsorAccountKeys.length > 0
        ? await buildAgentAccountListForRecipient(runtime, sponsorAccountKeys, accountKey, depthRemaining, nextVisitedKeys, debugState)
        : [];
    delete accountStruct.agentParentRecipientAccountList;
    const pendingSummary = await getPendingRewardsSummary(runtime, accountKey);
    accountStruct.totalSpCoins = buildTotalSpCoinsRecord(
        accountStruct.balanceOf,
        accountStruct.stakedBalance,
        pendingSummary.pendingRewardsRecord,
    );
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
        recipientAccount.recipientRateBranches = await buildRecipientRateRelationshipList(runtime, sponsorAccountKey, recipientKey, debugState);
        recipientAccount.agentAccountList = [];
        recipientAccountMap.set(
            String(recipientKey ?? "").trim().toLowerCase(),
            mergeAccountNode(recipientAccountMap.get(String(recipientKey ?? "").trim().toLowerCase()), recipientAccount),
        );
    }
    recipientAccountList.push(...Array.from(recipientAccountMap.values()));
    return recipientAccountList;
}

async function buildAgentAccountListForRecipient(runtime, sponsorAccountKeys, recipientAccountKey, depthRemaining, visitedKeys, debugState) {
    const agentAccountMap = new Map();
    for (const sponsorAccountKey of Array.isArray(sponsorAccountKeys) ? sponsorAccountKeys : []) {
        if (debugState) debugState.recipientRateReads += 1;
        const recipientRateKeys = await getRecipientRateListCached(runtime, sponsorAccountKey, recipientAccountKey);
        for (const recipientRateKey of Array.from(new Set(Array.isArray(recipientRateKeys) ? recipientRateKeys.map((value) => String(value ?? "")) : []))) {
            if (debugState) debugState.recipientAgentReads += 1;
            const agentAccountKeys = await getRecipientRateAgentListCached(
                runtime,
                sponsorAccountKey,
                recipientAccountKey,
                recipientRateKey,
            );
            for (const agentAccountKey of Array.from(new Set(Array.isArray(agentAccountKeys) ? agentAccountKeys.map((value) => String(value ?? "").trim().toLowerCase()) : []))) {
                if (debugState) debugState.agentRateReads += 1;
                const agentRateKeys = await getAgentRateListCached(
                    runtime,
                    sponsorAccountKey,
                    recipientAccountKey,
                    recipientRateKey,
                    agentAccountKey,
                );
                for (const agentRateKey of Array.from(new Set(Array.isArray(agentRateKeys) ? agentRateKeys.map((value) => String(value ?? "")) : []))) {
                    const agentAccount = await buildNestedAccountRecord(runtime, agentAccountKey, depthRemaining, visitedKeys, debugState);
                    agentAccount.agentRateBranches = mergeBranchMaps(
                        agentAccount.agentRateBranches,
                        toAgentRateKeysRecord([
                            buildAgentParentRelationshipRecord(
                                agentRateKey,
                                (
                                    await getAgentRateRecordFieldsCached(
                                        runtime,
                                        sponsorAccountKey,
                                        recipientAccountKey,
                                        recipientRateKey,
                                        agentAccountKey,
                                        agentRateKey,
                                    )
                                )?.[2] ?? "0",
                            ),
                        ]),
                    );
                    agentAccountMap.set(
                        agentAccountKey,
                        mergeAccountNode(agentAccountMap.get(agentAccountKey), agentAccount),
                    );
                }
            }
        }
    }
    return Array.from(agentAccountMap.values());
}

export async function getAccountRecord(context, _accountKey) {
    const runtime = context;
    const debugState = createRelationshipBuildDebug(runtime, _accountKey);
    const accountStruct = await buildAccountRecord(runtime, _accountKey, 1, new Set(), debugState);
    debugState.logSummary("getAccountRecord");
    runtime.spCoinLogger.logExitFunction();
    return accountStruct;
}

