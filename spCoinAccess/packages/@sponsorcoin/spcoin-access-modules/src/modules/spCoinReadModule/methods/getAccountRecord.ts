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

function buildPendingRewardsMethod(accountKey, method) {
    return {
        __lazyPendingRewardsMethod: true,
        method,
        accountKey: String(accountKey ?? ""),
    };
}

function buildTotalSpCoinsRecord(balanceOf, stakedBalance, pendingRewardsRecord, annualInflationRate = "0%", accountKey = undefined) {
    const normalizedBalanceOf = String(balanceOf ?? "0");
    const normalizedStakedBalance = String(stakedBalance ?? "0");
    const normalizedPendingRewardsRecord =
        pendingRewardsRecord && typeof pendingRewardsRecord === "object"
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
        mode: buildPendingRewardsAction(accountKey, "estimate"),
        runPendingRewards: buildPendingRewardsAction(accountKey, "estimate"),
        estimateOffChainTotalRewards: buildPendingRewardsMethod(accountKey, "estimateOffChainTotalRewards"),
        claimOnChainTotalRewards: buildPendingRewardsMethod(accountKey, "claimOnChainTotalRewards"),
        estimateOffChainSponsorRewards: buildPendingRewardsMethod(accountKey, "estimateOffChainSponsorRewards"),
        claimOnChainSponsorRewards: buildPendingRewardsMethod(accountKey, "claimOnChainSponsorRewards"),
        estimateOffChainRecipientRewards: buildPendingRewardsMethod(accountKey, "estimateOffChainRecipientRewards"),
        claimOnChainRecipientRewards: buildPendingRewardsMethod(accountKey, "claimOnChainRecipientRewards"),
        estimateOffChainAgentRewards: buildPendingRewardsMethod(accountKey, "estimateOffChainAgentRewards"),
        claimOnChainAgentRewards: buildPendingRewardsMethod(accountKey, "claimOnChainAgentRewards"),
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
    const accountKeyStr = String(accountKey ?? "");
    return {
        TYPE: "--TOTAL_SP_COINS--",
        totalSpCoins: (
            toBigIntValue(normalizedBalanceOf) +
            toBigIntValue(normalizedStakedBalance) +
            toBigIntValue(normalizedPendingRewards)
        ).toString(),
        balanceOf: normalizedBalanceOf,
        stakedBalance: normalizedStakedBalance,
        annualInflationRate: String(annualInflationRate ?? "0%"),
        mode: 'Claim',
        claim: buildPendingRewardsAction(accountKeyStr, "claim"),
        update: buildPendingRewardsAction(accountKeyStr, "estimate"),
        pendingRewards: pendingRewardsDisplay,
    };
}

function buildPendingRewardsRecord(rewardsByType = undefined, accountKey = undefined, accountRecord = undefined) {
    const lastSponsorUpdate = String(
        rewardsByType?.lastSponsorUpdate ??
        accountRecord?.lastSponsorUpdate ??
        accountRecord?.lastSponsorUpdateTimeStamp ??
        "0"
    );
    const lastRecipientUpdate = String(
        rewardsByType?.lastRecipientUpdate ??
        accountRecord?.lastRecipientUpdate ??
        accountRecord?.lastRecipientUpdateTimeStamp ??
        "0"
    );
    const lastAgentUpdate = String(
        rewardsByType?.lastAgentUpdate ??
        accountRecord?.lastAgentUpdate ??
        accountRecord?.lastAgentUpdateTimeStamp ??
        "0"
    );
    const hasRewardValues = Boolean(rewardsByType && typeof rewardsByType === "object");
    if (!hasRewardValues) {
        return {
            TYPE: "--PENDING_REWARDS--",
            mode: buildPendingRewardsAction(accountKey, "estimate"),
            runPendingRewards: buildPendingRewardsAction(accountKey, "estimate"),
            estimateOffChainTotalRewards: buildPendingRewardsMethod(accountKey, "estimateOffChainTotalRewards"),
            claimOnChainTotalRewards: buildPendingRewardsMethod(accountKey, "claimOnChainTotalRewards"),
            estimateOffChainSponsorRewards: buildPendingRewardsMethod(accountKey, "estimateOffChainSponsorRewards"),
            claimOnChainSponsorRewards: buildPendingRewardsMethod(accountKey, "claimOnChainSponsorRewards"),
            estimateOffChainRecipientRewards: buildPendingRewardsMethod(accountKey, "estimateOffChainRecipientRewards"),
            claimOnChainRecipientRewards: buildPendingRewardsMethod(accountKey, "claimOnChainRecipientRewards"),
            estimateOffChainAgentRewards: buildPendingRewardsMethod(accountKey, "estimateOffChainAgentRewards"),
            claimOnChainAgentRewards: buildPendingRewardsMethod(accountKey, "claimOnChainAgentRewards"),
            claim: buildPendingRewardsAction(accountKey, "claim"),
            estimate: buildPendingRewardsAction(accountKey, "estimate"),
            lastSponsorUpdate,
            lastRecipientUpdate,
            lastAgentUpdate,
        };
    }
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
        mode: buildPendingRewardsAction(accountKey, "estimate"),
        runPendingRewards: buildPendingRewardsAction(accountKey, "estimate"),
        estimateOffChainTotalRewards: buildPendingRewardsMethod(accountKey, "estimateOffChainTotalRewards"),
        claimOnChainTotalRewards: buildPendingRewardsMethod(accountKey, "claimOnChainTotalRewards"),
        estimateOffChainSponsorRewards: buildPendingRewardsMethod(accountKey, "estimateOffChainSponsorRewards"),
        claimOnChainSponsorRewards: buildPendingRewardsMethod(accountKey, "claimOnChainSponsorRewards"),
        estimateOffChainRecipientRewards: buildPendingRewardsMethod(accountKey, "estimateOffChainRecipientRewards"),
        claimOnChainRecipientRewards: buildPendingRewardsMethod(accountKey, "claimOnChainRecipientRewards"),
        estimateOffChainAgentRewards: buildPendingRewardsMethod(accountKey, "estimateOffChainAgentRewards"),
        claimOnChainAgentRewards: buildPendingRewardsMethod(accountKey, "claimOnChainAgentRewards"),
        pendingRewards:
            (
                toBigIntValue(pendingSponsorRewards) +
                toBigIntValue(pendingRecipientRewards) +
                toBigIntValue(pendingAgentRewards)
            ).toString(),
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
            typeof runtime.estimateOffChainTotalRewards === "function"
                ? await runtime.estimateOffChainTotalRewards(accountKey)
                : await runtime.getAccountStakingRewards(accountKey);
        const totalPending =
            toBigIntValue(rewardsByType?.pendingRewards) ||
            toBigIntValue(rewardsByType?.sponsorRewardsList?.stakingRewards) +
            toBigIntValue(rewardsByType?.recipientRewardsList?.stakingRewards) +
            toBigIntValue(rewardsByType?.agentRewardsList?.stakingRewards);
        return {
            pendingRewardsRecord: buildPendingRewardsRecord(rewardsByType, accountKey),
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
}

async function getBaseAccountRecord(runtime, accountKey) {
    const readAccountRecord = runtime?.spCoinContractDeployed?.getAccountRecord;
    if (typeof readAccountRecord !== "function") {
        return getShallowAccountRecord(runtime, accountKey, false);
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
        totalSpCoins: buildTotalSpCoinsRecord(
            bigIntToDecString(accountBalance),
            bigIntToDecString(stakedAccountSPCoins),
            buildPendingRewardsRecord(undefined, accountKey, {
                lastSponsorUpdateTimeStamp,
                lastRecipientUpdateTimeStamp,
                lastAgentUpdateTimeStamp,
            }),
            "0%",
            accountKey,
        ),
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
        accountStruct.totalSpCoins = buildTotalSpCoinsRecord("0", "0", buildPendingRewardsRecord(undefined, accountKey, accountStruct), "0%", accountKey);
        accountStruct.agentRates = {};
        accountStruct.recipientRates = {};
        return accountStruct;
    }
    const pendingSummary = includePendingRewards
        ? await getPendingRewardsSummary(runtime, accountKey)
        : { pendingRewardsRecord: buildPendingRewardsRecord(undefined, accountKey, accountStruct), totalPending: 0n };
    const inflationRate = includePendingRewards
        ? await getInflationRateCached(runtime)
        : 0;
    accountStruct.totalSpCoins = buildTotalSpCoinsRecord(
        accountStruct.balanceOf,
        accountStruct.stakedBalance,
        pendingSummary.pendingRewardsRecord,
        `${String(inflationRate ?? 0)}%`,
        accountKey,
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
        : { pendingRewardsRecord: buildPendingRewardsRecord(undefined, accountKey, accountStruct), totalPending: 0n };
    const inflationRate = includePendingRewards
        ? await getInflationRateCached(runtime)
        : 0;
    accountStruct.totalSpCoins = buildTotalSpCoinsRecord(
        accountStruct.balanceOf,
        accountStruct.stakedBalance,
        pendingSummary.pendingRewardsRecord,
        `${String(inflationRate ?? 0)}%`,
        accountKey,
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
    const accountStruct = await getBaseAccountRecord(runtime, _accountKey);
    runtime.spCoinLogger.logExitFunction();
    return accountStruct;
}

export async function getAccountRecordShallow(context, _accountKey) {
    const runtime = context;
    const accountStruct = await getShallowAccountRecord(runtime, _accountKey);
    runtime.spCoinLogger.logExitFunction();
    return accountStruct;
}
