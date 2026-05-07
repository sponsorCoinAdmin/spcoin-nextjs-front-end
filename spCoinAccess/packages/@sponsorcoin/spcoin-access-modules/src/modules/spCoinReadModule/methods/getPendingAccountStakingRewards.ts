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
    const provider = runtime?.spCoinContractDeployed?.runner?.provider || runtime?.spCoinContractDeployed?.provider;
    if (provider && typeof provider.getBlock === "function") {
        const pendingBlock = await provider.getBlock("pending").catch(() => null);
        const latestBlock = await provider.getBlock("latest").catch(() => null);
        const pendingTimestamp = toBigIntValue(pendingBlock?.timestamp);
        const latestTimestamp = toBigIntValue(latestBlock?.timestamp);
        const timestamp = pendingTimestamp > latestTimestamp ? pendingTimestamp : latestTimestamp;
        if (timestamp != null)
            return toBigIntValue(timestamp);
    }
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
        return 0n;
    return calculatePendingStakingRewards(
        setRecord.totalStaked,
        setRecord.lastUpdateTimeStamp,
        currentTimeStamp,
        recipientRate,
    );
}

async function calculateAgentSetRewards(runtime, sponsorKey, recipientKey, recipientRate, agentKey, agentRate, currentTimeStamp) {
    const setRecord = await getAgentRateTransactionSetCached(runtime, sponsorKey, recipientKey, recipientRate, agentKey, agentRate);
    if (!setRecord?.inserted)
        return 0n;
    return calculatePendingStakingRewards(
        setRecord.totalStaked,
        setRecord.lastUpdateTimeStamp,
        currentTimeStamp,
        agentRate,
    );
}

async function getRecipientRates(runtime, sponsorKey, recipientKey) {
    try {
        return toRateList(await getRecipientRateListCached(runtime, sponsorKey, recipientKey));
    }
    catch (_error) {
        return [];
    }
}

async function getRecipientRateAgents(runtime, sponsorKey, recipientKey, recipientRate) {
    try {
        return toAddressList(await getRecipientRateAgentListCached(runtime, sponsorKey, recipientKey, recipientRate));
    }
    catch (_error) {
        return [];
    }
}

async function getAgentRates(runtime, sponsorKey, recipientKey, recipientRate, agentKey) {
    try {
        return toRateList(await getAgentRateListCached(runtime, sponsorKey, recipientKey, recipientRate, agentKey));
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
            const recipientRewards = await calculateRecipientSetRewards(runtime, accountKey, recipientKey, recipientRate, currentTimeStamp);
            const sponsorParentAmount = calculateParentRewardAmount(recipientRewards, recipientRate);
            addPending(pending, "pendingSponsorRewards", calculateSponsorDepositAmount(sponsorParentAmount, annualInflation));

            const agentKeys = await getRecipientRateAgents(runtime, accountKey, recipientKey, recipientRate);
            for (const agentKey of agentKeys) {
                const agentRates = await getAgentRates(runtime, accountKey, recipientKey, recipientRate, agentKey);
                for (const agentRate of agentRates) {
                    const agentRewards = await calculateAgentSetRewards(runtime, accountKey, recipientKey, recipientRate, agentKey, agentRate, currentTimeStamp);
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
            const recipientRewards = await calculateRecipientSetRewards(runtime, sponsorKey, accountKey, recipientRate, currentTimeStamp);
            addPending(pending, "pendingRecipientRewards", recipientRewards);

            const agentKeys = await getRecipientRateAgents(runtime, sponsorKey, accountKey, recipientRate);
            for (const agentKey of agentKeys) {
                const agentRates = await getAgentRates(runtime, sponsorKey, accountKey, recipientRate, agentKey);
                for (const agentRate of agentRates) {
                    const agentRewards = await calculateAgentSetRewards(runtime, sponsorKey, accountKey, recipientRate, agentKey, agentRate, currentTimeStamp);
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
                    const agentRewards = await calculateAgentSetRewards(runtime, sponsorKey, parentRecipientKey, recipientRate, accountKey, agentRate, currentTimeStamp);
                    addPending(pending, "pendingAgentRewards", agentRewards);
                }
            }
        }
    }
}

export async function getPendingAccountStakingRewards(context, accountKey, timestampOverride = undefined) {
    const runtime = context;
    runtime.spCoinLogger.logFunctionHeader("getPendingAccountStakingRewards(" + accountKey + ")");
    const currentTimeStamp = await getCurrentBlockTimestamp(runtime, timestampOverride);
    const annualInflation = await getAnnualInflation(runtime);
    const pending = {
        TYPE: "--PENDING_ACCOUNT_STAKING_REWARDS--",
        accountKey: String(accountKey ?? ""),
        calculatedAt: new Date(Number(currentTimeStamp) * 1000).toISOString(),
        calculatedAtTimestamp: currentTimeStamp.toString(),
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
}
