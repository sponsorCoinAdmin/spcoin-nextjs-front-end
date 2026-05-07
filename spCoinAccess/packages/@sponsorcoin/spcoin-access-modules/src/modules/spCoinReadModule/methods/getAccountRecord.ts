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

function buildTotalSpCoinsRecord(balanceOf, stakedBalance, pendingRewardsRecord, sponsorRewardRate = "0%") {
    const normalizedBalanceOf = String(balanceOf ?? "0");
    const normalizedStakedBalance = String(stakedBalance ?? "0");
    const normalizedPendingRewardsRecord =
        pendingRewardsRecord && typeof pendingRewardsRecord === "object"
            ? pendingRewardsRecord
            : buildPendingRewardsRecord();
    const normalizedPendingRewards = String(normalizedPendingRewardsRecord.pendingRewards ?? "0");
    return {
        TYPE: "--TOTAL_SP_COINS--",
        totalSpCoins: (
            toBigIntValue(normalizedBalanceOf) +
            toBigIntValue(normalizedStakedBalance) +
            toBigIntValue(normalizedPendingRewards)
        ).toString(),
        balanceOf: normalizedBalanceOf,
        stakedBalance: normalizedStakedBalance,
        sponsorRewardRate: String(sponsorRewardRate ?? "0%"),
        pendingRewards: normalizedPendingRewardsRecord,
    };
}

function buildPendingRewardsRecord(rewardsByType = undefined) {
    const pendingSponsorRewards = String(
        rewardsByType?.pendingSponsorRewards ??
        rewardsByType?.sponsorRewardsList?.stakingRewards ??
        "0"
    );
    const pendingRecipientRewards = String(
        rewardsByType?.pendingRecipientRewards ??
        rewardsByType?.recipientRewardsList?.stakingRewards ??
        "0"
    );
    const pendingAgentRewards = String(
        rewardsByType?.pendingAgentRewards ??
        rewardsByType?.agentRewardsList?.stakingRewards ??
        "0"
    );
    return {
        TYPE: "--PENDING_REWARDS--",
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

function mergeRateMaps(existingValue, incomingValue) {
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
        recipientRates: mergeRateMaps(existingAccount.recipientRates, incomingAccount.recipientRates),
        agentRates: mergeRateMaps(existingAccount.agentRates, incomingAccount.agentRates),
        recipientKeys: Array.isArray(incomingAccount.recipientKeys) && incomingAccount.recipientKeys.length > 0
            ? incomingAccount.recipientKeys
            : existingAccount.recipientKeys,
        agentKeys: Array.isArray(incomingAccount.agentKeys) && incomingAccount.agentKeys.length > 0
            ? incomingAccount.agentKeys
            : existingAccount.agentKeys,
    };
}

export function getRelationshipReadCache(runtime) {
    if (!runtime.__relationshipReadCache) {
        runtime.__relationshipReadCache = {
            accountRecordObject: new Map(),
            accountRoleSummary: new Map(),
            recipientRateList: new Map(),
            recipientRateAgentList: new Map(),
            agentRateList: new Map(),
            recipientTransactionFields: new Map(),
            agentTransactionFields: new Map(),
            rateTransactionSet: new Map(),
            recipientRateTransactionSet: new Map(),
            agentRateTransactionSet: new Map(),
            pendingRewardsSummary: new Map(),
            inflationRate: undefined,
        };
    }
    runtime.__relationshipReadCache.accountRecordObject ||= new Map();
    runtime.__relationshipReadCache.accountRoleSummary ||= new Map();
    runtime.__relationshipReadCache.rateTransactionSet ||= new Map();
    runtime.__relationshipReadCache.recipientRateTransactionSet ||= new Map();
    runtime.__relationshipReadCache.agentRateTransactionSet ||= new Map();
    return runtime.__relationshipReadCache;
}

export function normalizeAccountRecordCacheKey(accountKey) {
    return String(accountKey ?? "").trim().toLowerCase();
}

export async function getInflationRateCached(runtime) {
    const cache = getRelationshipReadCache(runtime);
    if (!cache.inflationRate) {
        const readInflationRate = runtime?.spCoinContractDeployed?.getInflationRate;
        cache.inflationRate =
            typeof readInflationRate === "function"
                ? readInflationRate()
                : Promise.resolve(0);
    }
    return await cache.inflationRate;
}

export async function getAccountRecordObjectCached(runtime, accountKey) {
    const cache = getRelationshipReadCache(runtime);
    const key = normalizeAccountRecordCacheKey(accountKey);
    if (!cache.accountRecordObject.has(key)) {
        cache.accountRecordObject.set(key, runtime.spCoinSerialize.getAccountRecordObject(accountKey));
    }
    return await cache.accountRecordObject.get(key);
}

export async function getRecipientRateListCached(runtime, sponsorAccountKey, recipientAccountKey) {
    const cache = getRelationshipReadCache(runtime);
    const key = `${String(sponsorAccountKey ?? "").trim().toLowerCase()}|${String(recipientAccountKey ?? "").trim().toLowerCase()}`;
    if (!cache.recipientRateList.has(key)) {
        cache.recipientRateList.set(key, runtime.getRecipientRateList(sponsorAccountKey, recipientAccountKey));
    }
    return await cache.recipientRateList.get(key);
}

export async function getRecipientRateAgentListCached(runtime, sponsorAccountKey, recipientAccountKey, recipientRateKey) {
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

export async function getAgentRateListCached(runtime, sponsorAccountKey, recipientAccountKey, recipientRateKey, agentAccountKey) {
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

export async function getRateTransactionSetCached(runtime, setKey) {
    const cache = getRelationshipReadCache(runtime);
    const key = String(setKey ?? "");
    if (!key)
        return null;
    if (!cache.rateTransactionSet.has(key)) {
        const readRateTransactionSet = runtime?.spCoinContractDeployed?.getRateTransactionSet;
        cache.rateTransactionSet.set(
            key,
            typeof readRateTransactionSet === "function"
                ? readRateTransactionSet(setKey)
                : Promise.resolve(null),
        );
    }
    const result = await cache.rateTransactionSet.get(key);
    if (!Array.isArray(result))
        return null;
    return {
        setKey: result[0],
        rate: result[1],
        creationTimeStamp: result[2],
        lastUpdateTimeStamp: result[3],
        totalStaked: result[4],
        transactionCount: result[5],
        inserted: Boolean(result[6]),
    };
}

export async function getRecipientRateTransactionSetCached(runtime, sponsorAccountKey, recipientAccountKey, recipientRateKey) {
    const cache = getRelationshipReadCache(runtime);
    const key = `${String(sponsorAccountKey ?? "").trim().toLowerCase()}|${String(recipientAccountKey ?? "").trim().toLowerCase()}|${String(recipientRateKey ?? "")}`;
    if (cache.recipientRateTransactionSet.has(key)) {
        return await cache.recipientRateTransactionSet.get(key);
    }
    const getSetKey = runtime?.spCoinContractDeployed?.getRecipientRateTransactionSetKey;
    if (typeof getSetKey !== "function")
        return null;
    const resultPromise = (async () => {
        const setKey = await getSetKey(sponsorAccountKey, recipientAccountKey, recipientRateKey);
        return getRateTransactionSetCached(runtime, setKey);
    })();
    cache.recipientRateTransactionSet.set(key, resultPromise);
    return await resultPromise;
}

export async function getAgentRateTransactionSetCached(runtime, sponsorAccountKey, recipientAccountKey, recipientRateKey, agentAccountKey, agentRateKey) {
    const cache = getRelationshipReadCache(runtime);
    const key = `${String(sponsorAccountKey ?? "").trim().toLowerCase()}|${String(recipientAccountKey ?? "").trim().toLowerCase()}|${String(recipientRateKey ?? "")}|${String(agentAccountKey ?? "").trim().toLowerCase()}|${String(agentRateKey ?? "")}`;
    if (cache.agentRateTransactionSet.has(key)) {
        return await cache.agentRateTransactionSet.get(key);
    }
    const getSetKey = runtime?.spCoinContractDeployed?.getAgentRateTransactionSetKey;
    if (typeof getSetKey !== "function")
        return null;
    const resultPromise = (async () => {
        const setKey = await getSetKey(sponsorAccountKey, recipientAccountKey, recipientRateKey, agentAccountKey, agentRateKey);
        return getRateTransactionSetCached(runtime, setKey);
    })();
    cache.agentRateTransactionSet.set(key, resultPromise);
    return await resultPromise;
}

async function getPendingRewardsSummary(runtime, accountKey) {
    const cache = getRelationshipReadCache(runtime);
    const key = String(accountKey ?? "").trim().toLowerCase();
    if (cache.pendingRewardsSummary.has(key)) {
        return await cache.pendingRewardsSummary.get(key);
    }
    const summaryPromise = (async () => {
        const rewardsByType =
            typeof runtime.getPendingAccountStakingRewards === "function"
                ? await runtime.getPendingAccountStakingRewards(accountKey)
                : await runtime.getAccountStakingRewards(accountKey);
        const totalPending =
            toBigIntValue(rewardsByType?.pendingRewards) ||
            toBigIntValue(rewardsByType?.sponsorRewardsList?.stakingRewards) +
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
        TYPE: "--AGENT_RATE--",
        agentRateKey: String(agentRateKey ?? ""),
        agentRate: String(agentRateKey ?? ""),
        stakedAmount: String(stakedAmount ?? "0"),
    };
}

function buildAgentRateRelationshipRecord(relationship) {
    return {
        TYPE: "--AGENT_RATE--",
        agentRate: String(relationship?.agentRate ?? relationship?.agentRateKey ?? ""),
        agentRateKey: String(relationship?.agentRateKey ?? relationship?.agentRate ?? ""),
        inserted: relationship?.inserted,
        creationTime: relationship?.creationTime,
        lastUpdateTime: relationship?.lastUpdateTime,
        stakedAmount: String(relationship?.stakedAmount ?? "0"),
        transactions: Array.isArray(relationship?.transactions) ? relationship.transactions : [],
    };
}

function toAgentRateKeysRecord(relationships) {
    const agentRates = {};
    for (const relationship of Array.isArray(relationships) ? relationships : []) {
        const agentRateKey = String(relationship?.agentRateKey ?? "");
        if (!agentRateKey) continue;
        agentRates[agentRateKey] = buildAgentRateRelationshipRecord(relationship);
    }
    return agentRates;
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
                const agentRateSet = await getAgentRateTransactionSetCached(
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
                        agentRateSet?.totalStaked ?? "0",
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
        const sponsorAccountKeys = Array.from(new Set(Array.isArray(recipientAccount?.sponsorKeys) ? recipientAccount.sponsorKeys.map((value) => String(value ?? "").trim().toLowerCase()) : []));
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
        const recipientRates = {};
        for (const recipientRateKey of Array.from(new Set(Array.isArray(recipientRateList) ? recipientRateList.map((value) => String(value ?? "")) : []))) {
            const recipientRateSet = await getRecipientRateTransactionSetCached(runtime, sponsorAccountKey, recipientAccountKey, recipientRateKey);
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
                const agentAccount = await getShallowAccountRecord(runtime, agentAccountKey, false);
                const agentRelationships = [];
                for (const agentRateKey of Array.isArray(agentRateKeys) ? Array.from(new Set(agentRateKeys.map((value) => String(value ?? "")))) : []) {
                    const agentRateSet = await getAgentRateTransactionSetCached(
                        runtime,
                        sponsorAccountKey,
                        recipientAccountKey,
                        recipientRateKey,
                        agentAccountKey,
                        agentRateKey,
                    );
                    agentRelationships.push({
                        TYPE: "--AGENT_RATE--",
                        agentRateKey,
                        agentRate: agentRateKey,
                        inserted: Boolean(agentRateSet?.inserted),
                        creationTime: String(agentRateSet?.creationTimeStamp ?? ""),
                        lastUpdateTime: String(agentRateSet?.lastUpdateTimeStamp ?? ""),
                        stakedAmount: String(agentRateSet?.totalStaked ?? "0"),
                        transactionCount: String(agentRateSet?.transactionCount ?? "0"),
                    });
                }
                agentAccount.agentRates = toAgentRateKeysRecord(agentRelationships);
                agentAccountMap.set(
                    agentAccountKey,
                    mergeAccountNode(agentAccountMap.get(agentAccountKey), agentAccount),
                );
            }
            recipientRates[String(recipientRateKey ?? "")] = {
                TYPE: "--RECIPIENT_RATE--",
                recipientRate: String(recipientRateKey ?? ""),
                recipientRateKey: String(recipientRateKey ?? ""),
                inserted: Boolean(recipientRateSet?.inserted),
                creationTime: String(recipientRateSet?.creationTimeStamp ?? ""),
                lastUpdateTime: String(recipientRateSet?.lastUpdateTimeStamp ?? ""),
                stakedAmount: String(recipientRateSet?.totalStaked ?? "0"),
                transactionCount: String(recipientRateSet?.transactionCount ?? "0"),
                transactions: [],
                agentKeys: Array.from(agentAccountMap.values()),
            };
        }
        return recipientRates;
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

function normalizeDisplayAddressList(value) {
    return Array.isArray(value)
        ? value.map((entry) => normalizeDisplayAddress(entry)).filter(Boolean)
        : [];
}

function normalizeAccountRelationshipKeys(accountStruct) {
    accountStruct.sponsorKeys = normalizeDisplayAddressList(accountStruct.sponsorKeys);
    accountStruct.recipientKeys = normalizeDisplayAddressList(accountStruct.recipientKeys);
    accountStruct.agentKeys = normalizeDisplayAddressList(accountStruct.agentKeys);
    accountStruct.parentRecipientKeys = normalizeDisplayAddressList(accountStruct.parentRecipientKeys);
    accountStruct.sponsorCount = String(accountStruct.sponsorCount ?? accountStruct.sponsorKeys.length ?? 0);
    accountStruct.recipientCount = String(accountStruct.recipientCount ?? accountStruct.recipientKeys.length ?? 0);
    accountStruct.agentCount = String(accountStruct.agentCount ?? accountStruct.agentKeys.length ?? 0);
    accountStruct.parentRecipientCount = String(accountStruct.parentRecipientCount ?? accountStruct.parentRecipientKeys.length ?? 0);
    accountStruct.active = Boolean(accountStruct.active);
}

function isEmptyBaseAccountRecord(accountStruct) {
    if (!accountStruct || typeof accountStruct !== "object") return true;
    const normalizedAccountKey = normalizeDisplayAddress(accountStruct.accountKey);
    const normalizedCreationTime = String(accountStruct.creationTime ?? "").trim();
    const normalizedBalanceOf = String(accountStruct.balanceOf ?? "0").replace(/,/g, "").trim() || "0";
    const normalizedStakedBalance = String(accountStruct.stakedBalance ?? "0").replace(/,/g, "").trim() || "0";
    return (
        !!normalizedAccountKey &&
        normalizedCreationTime === "0" &&
        normalizedBalanceOf === "0" &&
        normalizedStakedBalance === "0" &&
        (!Array.isArray(accountStruct.sponsorKeys) || accountStruct.sponsorKeys.length === 0) &&
        (!Array.isArray(accountStruct.recipientKeys) || accountStruct.recipientKeys.length === 0) &&
        (!Array.isArray(accountStruct.agentKeys) || accountStruct.agentKeys.length === 0) &&
        (!Array.isArray(accountStruct.parentRecipientKeys) || accountStruct.parentRecipientKeys.length === 0)
    );
}

async function getShallowAccountRecord(runtime, accountKey, includePendingRewards = true) {
    const baseAccountStruct = await getAccountRecordObjectCached(runtime, accountKey);
    const accountStruct = { ...(baseAccountStruct || {}) };
    accountStruct.TYPE = String(accountStruct.TYPE || "--ACCOUNT--");
    accountStruct.accountKey = normalizeDisplayAddress(accountKey);
    normalizeAccountRelationshipKeys(accountStruct);
    if (isEmptyBaseAccountRecord(accountStruct)) {
        accountStruct.creationTime = "";
        accountStruct.totalSpCoins = buildTotalSpCoinsRecord("0", "0", buildPendingRewardsRecord(), "0%");
        accountStruct.agentRates = {};
        accountStruct.recipientRates = {};
        return accountStruct;
    }
    const pendingSummary = includePendingRewards
        ? await getPendingRewardsSummary(runtime, accountKey)
        : { pendingRewardsRecord: buildPendingRewardsRecord(), totalPending: 0n };
    const inflationRate = includePendingRewards
        ? await getInflationRateCached(runtime)
        : 0;
    accountStruct.totalSpCoins = buildTotalSpCoinsRecord(
        accountStruct.balanceOf,
        accountStruct.stakedBalance,
        pendingSummary.pendingRewardsRecord,
        `${String(inflationRate ?? 0)}%`,
    );
    delete accountStruct.balanceOf;
    delete accountStruct.stakedBalance;
    accountStruct.agentRates = {};
    accountStruct.recipientRates = {};
    return accountStruct;
}

async function buildAccountRecord(runtime, accountKey, depthRemaining, visitedKeys, debugState, includePendingRewards = true) {
    const normalizedKey = String(accountKey ?? "").trim().toLowerCase();
    const nextVisitedKeys = new Set(visitedKeys || []);
    if (normalizedKey)
        nextVisitedKeys.add(normalizedKey);
    if (debugState) debugState.accountRecordReads += 1;
    const baseAccountStruct = await getAccountRecordObjectCached(runtime, accountKey);
    const accountStruct = { ...(baseAccountStruct || {}) };
    accountStruct.TYPE = String(accountStruct.TYPE || "--ACCOUNT--");
    accountStruct.accountKey = normalizeDisplayAddress(accountKey);
    normalizeAccountRelationshipKeys(accountStruct);
    const sponsorAccountKeys = Array.isArray(accountStruct.sponsorKeys) ? accountStruct.sponsorKeys : [];
    const recipientAccountKeys = Array.isArray(accountStruct.recipientKeys) ? accountStruct.recipientKeys : [];
    const parentRecipientKeys = Array.isArray(accountStruct.parentRecipientKeys)
        ? accountStruct.parentRecipientKeys
        : [];
    try {
        accountStruct.agentRates = toAgentRateKeysRecord(
            await buildAgentParentRelationshipList(runtime, accountKey, parentRecipientKeys, debugState),
        );
    }
    catch (error) {
        accountStruct.agentRates = {};
        runtime?.spCoinLogger?.logDetail?.(
            `JS => buildAgentParentRelationshipList soft-failed for ${String(accountKey ?? "")}: ${String(error?.message || error)}`,
        );
    }
    const recipientAccountList = await buildRecipientAccountList(runtime, accountKey, recipientAccountKeys, depthRemaining, nextVisitedKeys, debugState);
    accountStruct.recipientKeys = recipientAccountList;
    accountStruct.recipientRates = Object.fromEntries(
        recipientAccountList.map((recipientAccount) => [
            String(recipientAccount?.accountKey ?? recipientAccount?.recipientKey ?? "").trim().toLowerCase(),
            recipientAccount?.recipientRates ?? {},
        ]).filter(([recipientKey]) => Boolean(recipientKey)),
    );
    accountStruct.agentKeys = sponsorAccountKeys.length > 0
        ? await buildAgentAccountListForRecipient(runtime, sponsorAccountKeys, accountKey, depthRemaining, nextVisitedKeys, debugState)
        : [];
    const pendingSummary = includePendingRewards
        ? await getPendingRewardsSummary(runtime, accountKey)
        : { pendingRewardsRecord: buildPendingRewardsRecord(), totalPending: 0n };
    const inflationRate = includePendingRewards
        ? await getInflationRateCached(runtime)
        : 0;
    accountStruct.totalSpCoins = buildTotalSpCoinsRecord(
        accountStruct.balanceOf,
        accountStruct.stakedBalance,
        pendingSummary.pendingRewardsRecord,
        `${String(inflationRate ?? 0)}%`,
    );
    delete accountStruct.balanceOf;
    delete accountStruct.stakedBalance;
    return accountStruct;
}

async function buildNestedAccountRecord(runtime, accountKey, depthRemaining, visitedKeys, debugState) {
    const normalizedKey = String(accountKey ?? "").trim().toLowerCase();
    if (!normalizedKey)
        return getShallowAccountRecord(runtime, accountKey, false);
    const activeVisitedKeys = new Set(visitedKeys || []);
    if (activeVisitedKeys.has(normalizedKey))
        return getShallowAccountRecord(runtime, accountKey, false);
    if (Number(depthRemaining) <= 0)
        return getShallowAccountRecord(runtime, accountKey, false);
    return buildAccountRecord(runtime, accountKey, Number(depthRemaining) - 1, activeVisitedKeys, debugState, false);
}

async function buildRecipientAccountList(runtime, sponsorAccountKey, recipientAccountKeys, depthRemaining, visitedKeys, debugState) {
    const recipientAccountList = [];
    const recipientAccountMap = new Map();
    for (const recipientKey of recipientAccountKeys || []) {
        const recipientAccount = await buildNestedAccountRecord(runtime, recipientKey, depthRemaining, visitedKeys, debugState);
        recipientAccount.TYPE = "--RECIPIENT_RECORD--";
        recipientAccount.recipientRates = await buildRecipientRateRelationshipList(runtime, sponsorAccountKey, recipientKey, debugState);
        recipientAccount.agentKeys = [];
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
                    const agentRateSet = await getAgentRateTransactionSetCached(
                        runtime,
                        sponsorAccountKey,
                        recipientAccountKey,
                        recipientRateKey,
                        agentAccountKey,
                        agentRateKey,
                    );
                    agentAccount.TYPE = "--AGENT_RECORD--";
                    agentAccount.agentRates = mergeRateMaps(
                        agentAccount.agentRates,
                        toAgentRateKeysRecord([
                            buildAgentParentRelationshipRecord(
                                agentRateKey,
                                agentRateSet?.totalStaked ?? "0",
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
    const accountStruct = await buildAccountRecord(runtime, _accountKey, 0, new Set(), debugState);
    debugState.logSummary("getAccountRecord");
    runtime.spCoinLogger.logExitFunction();
    return accountStruct;
}

export async function getAccountRecordShallow(context, _accountKey) {
    const runtime = context;
    const accountStruct = await getShallowAccountRecord(runtime, _accountKey);
    runtime.spCoinLogger.logExitFunction();
    return accountStruct;
}
