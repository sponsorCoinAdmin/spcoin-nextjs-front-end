// @ts-nocheck
import {
    getAccountRecordObjectCached,
    getAgentRateListCached,
    getAgentRateTransactionSetCached,
    getInflationRateCached,
    getRecipientRateAgentListCached,
    getRecipientRateListCached,
    getRecipientRateTransactionSetCached,
} from "./getAccountRecord";

const YEAR_SECONDS = 31556925n;
const DECIMAL_MULTIPLIER = 10n ** 18n;
const PERCENT_DIVISER = DECIMAL_MULTIPLIER / 100n;
const MIN_PENDING_REWARDS_CACHE_MS = 10_000;
const DEFAULT_PENDING_REWARDS_CACHE_MS = 10_000;

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

function toAddressList(value) {
    return Array.from(Array.isArray(value) ? value : []).map((entry) => String(entry ?? "").trim()).filter(Boolean);
}

function toRateList(value) {
    return Array.from(Array.isArray(value) ? value : []).map((entry) => String(entry ?? "").trim()).filter(Boolean);
}

function addPending(target, key, value) {
    target[key] = (toBigIntValue(target[key]) + toBigIntValue(value)).toString();
}

function normalizePendingRewardsOptions(optionsOrTimestampOverride = undefined, timestampOverride = undefined) {
    const options =
        optionsOrTimestampOverride &&
        typeof optionsOrTimestampOverride === "object" &&
        !Array.isArray(optionsOrTimestampOverride)
            ? optionsOrTimestampOverride
            : {};
    const rawTimestampOverride =
        timestampOverride ??
        options.timestampOverride ??
        options.currentTimeStamp ??
        options.currentTimestamp ??
        (options === optionsOrTimestampOverride ? undefined : optionsOrTimestampOverride);
    const requestedCacheMs = Number(
        options.pendingRewardsCacheMs ??
        options.cacheMs ??
        options.ttlMs ??
        options.cacheTtlMs ??
        DEFAULT_PENDING_REWARDS_CACHE_MS
    );
    const cacheMs = Math.max(
        MIN_PENDING_REWARDS_CACHE_MS,
        Number.isFinite(requestedCacheMs) ? requestedCacheMs : DEFAULT_PENDING_REWARDS_CACHE_MS,
    );
    return {
        timestampOverride: rawTimestampOverride,
        cacheMs,
    };
}

function getOffChainRewardsEstimateCache(runtime) {
    if (!runtime.__pendingRewardsCache || typeof runtime.__pendingRewardsCache !== "object") {
        runtime.__pendingRewardsCache = new Map();
    }
    return runtime.__pendingRewardsCache;
}

function getOffChainRewardsEstimateCacheKey(accountKey, timestampOverride) {
    const normalizedAccount = String(accountKey ?? "").trim().toLowerCase();
    const normalizedTimestamp = toBigIntValue(timestampOverride);
    return `${normalizedAccount}|${normalizedTimestamp > 0n ? normalizedTimestamp.toString() : "now"}`;
}

function clonePendingRewardsResult(value) {
    if (!value || typeof value !== "object") return value;
    try {
        return JSON.parse(JSON.stringify(value));
    }
    catch (_error) {
        return value;
    }
}

function formatLocalTimestamp(secondsValue) {
    const seconds = Number(toBigIntValue(secondsValue));
    if (!Number.isFinite(seconds) || seconds <= 0)
        return "N/A";
    const date = new Date(seconds * 1000);
    if (Number.isNaN(date.getTime()))
        return "N/A";
    const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase();
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    const hour24 = date.getHours();
    const hour12 = hour24 % 12 || 12;
    const minute = String(date.getMinutes()).padStart(2, "0");
    const meridiem = hour24 < 12 ? "a.m." : "p.m.";
    const timeZone = date
        .toLocaleTimeString("en-US", { timeZoneName: "short" })
        .split(" ")
        .pop() || "";
    return `${month}-${day}-${year}, ${hour12}:${minute} ${meridiem}${timeZone ? ` ${timeZone}` : ""}`;
}

function calculatePendingStakingRewards(totalStaked, lastUpdateTimeStamp, currentTimeStamp, rate) {
    const normalizedLastUpdate = toBigIntValue(lastUpdateTimeStamp);
    const normalizedCurrentTime = toBigIntValue(currentTimeStamp);
    const timeDiff = normalizedLastUpdate > normalizedCurrentTime ? 0n : normalizedCurrentTime - normalizedLastUpdate;
    return (timeDiff * toBigIntValue(totalStaked) * toBigIntValue(rate)) / 100n / YEAR_SECONDS;
}

function calculateSponsorDepositAmount(amount, annualInflation) {
    const normalizedAmount = toBigIntValue(amount);
    return normalizedAmount - ((normalizedAmount * toBigIntValue(annualInflation)) / 100n);
}

function calculateParentRewardAmount(amount, rate) {
    const normalizedRate = toBigIntValue(rate);
    if (normalizedRate <= 0n)
        return 0n;
    return ((toBigIntValue(amount) * DECIMAL_MULTIPLIER) / normalizedRate) / PERCENT_DIVISER;
}

async function getCurrentBlockTimestamp(runtime, timestampOverride = undefined) {
    const normalizedOverride = toBigIntValue(timestampOverride);
    if (normalizedOverride > 0n)
        return normalizedOverride;
    return BigInt(Math.floor(Date.now() / 1000));
}

async function getAnnualInflation(runtime) {
    try {
        return toBigIntValue(await getInflationRateCached(runtime));
    }
    catch (_error) {
        return 10n;
    }
}

async function getAccountLinks(runtime, accountKey) {
    const accountRecord = await getAccountRecordObjectCached(runtime, accountKey);
    return {
        sponsorKeys: toAddressList(accountRecord?.sponsorKeys),
        recipientKeys: toAddressList(accountRecord?.recipientKeys),
        parentRecipientKeys: toAddressList(accountRecord?.parentRecipientKeys),
    };
}

async function calculateRecipientSetRewards(runtime, sponsorKey, recipientKey, recipientRate, currentTimeStamp) {
    const setRecord = await getRecipientRateTransactionSetCached(runtime, sponsorKey, recipientKey, recipientRate);
    if (!setRecord?.inserted)
        return { rewards: 0n, lastUpdate: "0" };
    return {
        rewards: calculatePendingStakingRewards(
            setRecord.totalStaked,
            setRecord.lastUpdateTimeStamp,
            currentTimeStamp,
            recipientRate,
        ),
        lastUpdate: String(setRecord.lastUpdateTimeStamp ?? "0"),
    };
}

async function calculateAgentSetRewards(runtime, sponsorKey, recipientKey, recipientRate, agentKey, agentRate, currentTimeStamp) {
    const setRecord = await getAgentRateTransactionSetCached(runtime, sponsorKey, recipientKey, recipientRate, agentKey, agentRate);
    if (!setRecord?.inserted)
        return { rewards: 0n, lastUpdate: "0" };
    return {
        rewards: calculatePendingStakingRewards(
            setRecord.totalStaked,
            setRecord.lastUpdateTimeStamp,
            currentTimeStamp,
            agentRate,
        ),
        lastUpdate: String(setRecord.lastUpdateTimeStamp ?? "0"),
    };
}

async function getRecipientRates(runtime, sponsorKey, recipientKey) {
    try {
        const readOptions = { cache: "bypass" };
        return toRateList(await runtime.getRecipientRateList(sponsorKey, recipientKey, readOptions));
    }
    catch (_error) {
        return [];
    }
}

async function getRecipientRateAgents(runtime, sponsorKey, recipientKey, recipientRate) {
    try {
        const readOptions = { cache: "bypass" };
        return toAddressList(await runtime.getRecipientRateAgentList(sponsorKey, recipientKey, recipientRate, readOptions));
    }
    catch (_error) {
        return [];
    }
}

async function getAgentRates(runtime, sponsorKey, recipientKey, recipientRate, agentKey) {
    try {
        const readOptions = { cache: "bypass" };
        return toRateList(await runtime.getAgentRateList(sponsorKey, recipientKey, recipientRate, agentKey, readOptions));
    }
    catch (_error) {
        return [];
    }
}

async function addSponsorPathPending(runtime, pending, accountKey, currentTimeStamp, annualInflation) {
    const { recipientKeys } = await getAccountLinks(runtime, accountKey);
    for (const recipientKey of recipientKeys) {
            const recipientRates = await getRecipientRates(runtime, accountKey, recipientKey);
        for (const recipientRate of recipientRates) {
            const { rewards: recipientRewards, lastUpdate } = await calculateRecipientSetRewards(runtime, accountKey, recipientKey, recipientRate, currentTimeStamp);
            const sponsorParentAmount = calculateParentRewardAmount(recipientRewards, recipientRate);
            addPending(pending, "pendingSponsorRewards", calculateSponsorDepositAmount(sponsorParentAmount, annualInflation));

            const agentKeys = await getRecipientRateAgents(runtime, accountKey, recipientKey, recipientRate);
            for (const agentKey of agentKeys) {
                const agentRates = await getAgentRates(runtime, accountKey, recipientKey, recipientRate, agentKey);
                for (const agentRate of agentRates) {
                    const { rewards: agentRewards, lastUpdate: agentLastUpdate } = await calculateAgentSetRewards(runtime, accountKey, recipientKey, recipientRate, agentKey, agentRate, currentTimeStamp);
                    const recipientParentAmount = calculateParentRewardAmount(agentRewards, agentRate);
                    const sponsorAmount = calculateParentRewardAmount(recipientParentAmount, recipientRate);
                    addPending(pending, "pendingSponsorRewards", calculateSponsorDepositAmount(sponsorAmount, annualInflation));
                }
            }
        }
    }
}

async function addRecipientPathPending(runtime, pending, accountKey, currentTimeStamp) {
    const { sponsorKeys } = await getAccountLinks(runtime, accountKey);
    for (const sponsorKey of sponsorKeys) {
        const recipientRates = await getRecipientRates(runtime, sponsorKey, accountKey);
        for (const recipientRate of recipientRates) {
            const { rewards: recipientRewards, lastUpdate } = await calculateRecipientSetRewards(runtime, sponsorKey, accountKey, recipientRate, currentTimeStamp);
            addPending(pending, "pendingRecipientRewards", recipientRewards);

            const agentKeys = await getRecipientRateAgents(runtime, sponsorKey, accountKey, recipientRate);
            for (const agentKey of agentKeys) {
                const agentRates = await getAgentRates(runtime, sponsorKey, accountKey, recipientRate, agentKey);
                for (const agentRate of agentRates) {
                    const { rewards: agentRewards, lastUpdate: agentLastUpdate } = await calculateAgentSetRewards(runtime, sponsorKey, accountKey, recipientRate, agentKey, agentRate, currentTimeStamp);
                    addPending(pending, "pendingRecipientRewards", calculateParentRewardAmount(agentRewards, agentRate));
                }
            }
        }
    }
}

async function addAgentPathPending(runtime, pending, accountKey, currentTimeStamp) {
    const { parentRecipientKeys } = await getAccountLinks(runtime, accountKey);
    for (const parentRecipientKey of parentRecipientKeys) {
        const { sponsorKeys } = await getAccountLinks(runtime, parentRecipientKey);
        for (const sponsorKey of sponsorKeys) {
            const recipientRates = await getRecipientRates(runtime, sponsorKey, parentRecipientKey);
            for (const recipientRate of recipientRates) {
                const agentKeys = await getRecipientRateAgents(runtime, sponsorKey, parentRecipientKey, recipientRate);
                if (!agentKeys.map((key) => key.toLowerCase()).includes(String(accountKey).toLowerCase()))
                    continue;
                const agentRates = await getAgentRates(runtime, sponsorKey, parentRecipientKey, recipientRate, accountKey);
                for (const agentRate of agentRates) {
                    const { rewards: agentRewards, lastUpdate } = await calculateAgentSetRewards(runtime, sponsorKey, parentRecipientKey, recipientRate, accountKey, agentRate, currentTimeStamp);
                    addPending(pending, "pendingAgentRewards", agentRewards);
                }
            }
        }
    }
}

export async function computeOffChainRewardsEstimate(context, accountKey, optionsOrTimestampOverride = undefined, timestampOverride = undefined) {
    const runtime = context;
    const options = normalizePendingRewardsOptions(optionsOrTimestampOverride, timestampOverride);
    const cache = getOffChainRewardsEstimateCache(runtime);
    const cacheKey = getOffChainRewardsEstimateCacheKey(accountKey, options.timestampOverride);
    const nowMs = Date.now();
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAtMs > nowMs) {
        return clonePendingRewardsResult(await cached.promise);
    }
    runtime.spCoinLogger.logFunctionHeader("computeOffChainRewardsEstimate(" + accountKey + ")");
    const pendingPromise = (async () => {
        delete runtime.__relationshipReadCache;
        const currentTimeStamp = await getCurrentBlockTimestamp(runtime, options.timestampOverride);
        const annualInflation = await getAnnualInflation(runtime);
        const accountRecord = await getAccountRecordObjectCached(runtime, accountKey);
        const pending = {
            TYPE: "--ACCOUNT_PENDING_REWARDS--",
            accountKey: String(accountKey ?? ""),
            calculatedTimeStamp: currentTimeStamp.toString(),
            calculatedFormatted: formatLocalTimestamp(currentTimeStamp),
            lastSponsorUpdate: String(accountRecord?.lastSponsorUpdateTimeStamp ?? "0"),
            lastRecipientUpdate: String(accountRecord?.lastRecipientUpdateTimeStamp ?? "0"),
            lastAgentUpdate: String(accountRecord?.lastAgentUpdateTimeStamp ?? "0"),
            pendingRewards: "0",
            pendingSponsorRewards: "0",
            pendingRecipientRewards: "0",
            pendingAgentRewards: "0",
        };

        await addSponsorPathPending(runtime, pending, accountKey, currentTimeStamp, annualInflation);
        await addRecipientPathPending(runtime, pending, accountKey, currentTimeStamp);
        await addAgentPathPending(runtime, pending, accountKey, currentTimeStamp);
        pending.pendingRewards = (
            toBigIntValue(pending.pendingSponsorRewards) +
            toBigIntValue(pending.pendingRecipientRewards) +
            toBigIntValue(pending.pendingAgentRewards)
        ).toString();
        runtime.spCoinLogger.logExitFunction();
        return pending;
    })();
    cache.set(cacheKey, {
        expiresAtMs: nowMs + options.cacheMs,
        promise: pendingPromise,
    });
    try {
        return clonePendingRewardsResult(await pendingPromise);
    }
    catch (error) {
        cache.delete(cacheKey);
        throw error;
    }
}
