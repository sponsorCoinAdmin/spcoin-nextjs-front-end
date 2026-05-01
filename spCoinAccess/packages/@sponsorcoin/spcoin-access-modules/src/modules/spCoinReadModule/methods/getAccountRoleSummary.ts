// @ts-nocheck
import {
    getAccountRecordObjectCached,
    getRelationshipReadCache,
    normalizeAccountRecordCacheKey,
} from './getAccountRecord';

function listLength(value) {
    return Array.isArray(value) ? value.length : 0;
}

function normalizeAccountKey(value) {
    return String(value ?? '').trim().toLowerCase();
}

function buildAccountRoleSummary(accountKey, accountRecord, source) {
    const normalizedAccountKey = normalizeAccountKey(accountRecord?.accountKey || accountKey);
    const sponsorCount = listLength(accountRecord?.sponsorKeys);
    const recipientCount = listLength(accountRecord?.recipientKeys);
    const agentCount = listLength(accountRecord?.agentKeys);
    const parentRecipientCount = listLength(accountRecord?.parentRecipientKeys);
    const recipientRateTransactionSetCount = listLength(accountRecord?.recipientRateTransactionSetKeys);
    const agentRateTransactionSetCount = listLength(accountRecord?.agentRateTransactionSetKeys);
    const isSponsor = recipientCount > 0;
    const isRecipient = sponsorCount > 0 || agentCount > 0 || recipientRateTransactionSetCount > 0;
    const isAgent = parentRecipientCount > 0 || agentRateTransactionSetCount > 0;
    const roles = [
        isSponsor ? 'sponsor' : '',
        isRecipient ? 'recipient' : '',
        isAgent ? 'agent' : '',
    ].filter(Boolean);

    return {
        TYPE: '--ACCOUNT_ROLE_SUMMARY--',
        accountKey: normalizedAccountKey,
        roles,
        isSponsor,
        isRecipient,
        isAgent,
        source,
        counts: {
            sponsorCount,
            recipientCount,
            agentCount,
            parentRecipientCount,
            recipientRateTransactionSetCount,
            agentRateTransactionSetCount,
        },
    };
}

async function getCachedAccountRoleSummary(runtime, accountKey) {
    const cache = getRelationshipReadCache(runtime);
    const key = normalizeAccountRecordCacheKey(accountKey);
    const hadAccountRecord = cache.accountRecordObject.has(key);
    if (!cache.accountRoleSummary.has(key)) {
        cache.accountRoleSummary.set(
            key,
            (async () => {
                const accountRecord = await getAccountRecordObjectCached(runtime, accountKey);
                return buildAccountRoleSummary(
                    accountKey,
                    accountRecord,
                    hadAccountRecord ? 'accountRecordCache' : 'getAccountRecord',
                );
            })(),
        );
    }
    return await cache.accountRoleSummary.get(key);
}

export async function getAccountRoleSummary(context, _accountKey) {
    return getCachedAccountRoleSummary(context, _accountKey);
}

export async function getAccountRoles(context, _accountKey) {
    const summary = await getCachedAccountRoleSummary(context, _accountKey);
    return summary.roles;
}

export async function isSponsor(context, _accountKey) {
    const summary = await getCachedAccountRoleSummary(context, _accountKey);
    return summary.isSponsor;
}

export async function isRecipient(context, _accountKey) {
    const summary = await getCachedAccountRoleSummary(context, _accountKey);
    return summary.isRecipient;
}

export async function isAgent(context, _accountKey) {
    const summary = await getCachedAccountRoleSummary(context, _accountKey);
    return summary.isAgent;
}
