// @ts-nocheck
/**
 * SponsorCoin Access Modules
 * File: dist/offChain/deleteAccountTree.js
 * Role: Off-chain helper that walks the SponsorCoin account tree and deletes leaf records first.
 */
export async function deleteAccountTree() {
    var _a, _b, _c, _d;
    const read = (_a = this.onChain) === null || _a === void 0 ? void 0 : _a.read;
    const deleteMethods = (_b = this.onChain) === null || _b === void 0 ? void 0 : _b.delete;
    if (!read || !deleteMethods) {
        throw new Error("deleteAccountTree requires onChain read and delete access.");
    }
    if (typeof read.getAccountList !== "function" ||
        typeof read.getAccountRecipientList !== "function" ||
        typeof read.getRecipientRateList !== "function" ||
        typeof read.getRecipientRateAgentList !== "function") {
        throw new Error("deleteAccountTree requires the onChain read processor account traversal methods.");
    }
    if (typeof deleteMethods.deleteAccountRecord !== "function") {
        throw new Error("deleteAccountTree requires deleteAccountRecord on the onChain delete processor.");
    }
    const summary = {
        accountCount: 0,
        recipientCount: 0,
        recipientRateCount: 0,
        agentCount: 0,
        deletedAgentCount: 0,
        deletedRecipientCount: 0,
        deletedAccountCount: 0,
    };
    const accountList = await read.getAccountList();
    const accountKeySet = new Set((Array.isArray(accountList) ? accountList : []).map((accountKeyValue) => String(accountKeyValue)));
    const signerKey = String(((((_a = this.onChain) === null || _a === void 0 ? void 0 : _a.delete) === null || (_b = (_a = this.onChain) === null || _a === void 0 ? void 0 : _a.delete) === void 0 ? void 0 : _b.signer) && (((_c = this.onChain) === null || _c === void 0 ? void 0 : _c.delete.signer.address) || '')) || '').trim();
    const processedAccountKeys = new Set();
    const countedAccountKeys = new Set();
    const activeAccountKeys = new Set();
    const sleep = async (ms) => await new Promise((resolve) => setTimeout(resolve, ms));
    const isRetryableTransportError = (error) => {
        const text = String((error === null || error === void 0 ? void 0 : error.message) || error || '').toLowerCase();
        return (text.includes('failed to fetch') ||
            text.includes('fetchrequest.geturl') ||
            text.includes('network error') ||
            text.includes('timeout') ||
            text.includes('socket hang up') ||
            text.includes('missing response') ||
            text.includes('could not coalesce error'));
    };
    const callWithRetry = async (label, fn, attempts = 3, delayMs = 350) => {
        let lastError;
        for (let attempt = 1; attempt <= attempts; attempt++) {
            try {
                return await fn();
            }
            catch (error) {
                lastError = error;
                if (!isRetryableTransportError(error) || attempt === attempts) {
                    throw error;
                }
                (_d = (_c = this.logger) === null || _c === void 0 ? void 0 : _c.logDetail) === null || _d === void 0 ? void 0 : _d.call(_c, "JS => deleteAccountTree " + label + " retry #" + String(attempt) + " after transport error: " + String((error === null || error === void 0 ? void 0 : error.message) || error));
                await sleep(delayMs * attempt);
            }
        }
        throw lastError;
    };
    const walkAccountTree = async (sponsorKey, deferDelete = false) => {
        var _d, _e;
        if (processedAccountKeys.has(sponsorKey)) {
            return;
        }
        if (!countedAccountKeys.has(sponsorKey)) {
            summary.accountCount += 1;
            countedAccountKeys.add(sponsorKey);
        }
        if (activeAccountKeys.has(sponsorKey)) {
            (_b = (_a = this.logger) === null || _a === void 0 ? void 0 : _a.logDetail) === null || _b === void 0 ? void 0 : _b.call(_a, "JS => deleteAccountTree skipping recursive cycle for " + sponsorKey);
            return;
        }
        activeAccountKeys.add(sponsorKey);
        try {
            const recipientList = await callWithRetry("getAccountRecipientList(" + sponsorKey + ")", () => read.getAccountRecipientList(sponsorKey));
            for (const recipientKeyValue of Array.isArray(recipientList) ? recipientList : []) {
                const recipientKey = String(recipientKeyValue);
                summary.recipientCount += 1;
                if (accountKeySet.has(recipientKey)) {
                    await walkAccountTree(recipientKey, true);
                }
                const recipientRateList = await callWithRetry("getRecipientRateList(" + sponsorKey + "," + recipientKey + ")", () => read.getRecipientRateList(sponsorKey, recipientKey));
                for (const recipientRateKey of Array.isArray(recipientRateList) ? recipientRateList : []) {
                    summary.recipientRateCount += 1;
                    const agentList = await callWithRetry("getRecipientRateAgentList(" + sponsorKey + "," + recipientKey + "," + String(recipientRateKey) + ")", () => read.getRecipientRateAgentList(sponsorKey, recipientKey, recipientRateKey));
                    for (const agentKeyValue of Array.isArray(agentList) ? agentList : []) {
                        summary.agentCount += 1;
                        summary.deletedAgentCount += 1;
                    }
                }
                if (typeof deleteMethods.delRecipient === "function" || typeof deleteMethods.unSponsorRecipient === "function") {
                    await callWithRetry("delRecipient(" + sponsorKey + "," + recipientKey + ")", () => typeof deleteMethods.delRecipient === "function"
                        ? deleteMethods.delRecipient({ accountKey: sponsorKey }, recipientKey)
                        : deleteMethods.unSponsorRecipient({ accountKey: sponsorKey }, recipientKey));
                    summary.deletedRecipientCount += 1;
                    await sleep(200);
                }
                if (accountKeySet.has(recipientKey)) {
                    await walkAccountTree(recipientKey, false);
                }
            }
            const shouldDeferSignerDelete = !deferDelete && signerKey && sponsorKey.toLowerCase() === signerKey.toLowerCase();
            if (!deferDelete && !shouldDeferSignerDelete) {
                await callWithRetry("deleteAccountRecord(" + sponsorKey + ")", () => deleteMethods.deleteAccountRecord(sponsorKey));
                summary.deletedAccountCount += 1;
                processedAccountKeys.add(sponsorKey);
                await sleep(200);
            }
            else if (shouldDeferSignerDelete) {
                (_e = (_d = this.logger) === null || _d === void 0 ? void 0 : _d.logDetail) === null || _e === void 0 ? void 0 : _e.call(_d, "JS => deleteAccountTree deferring signer account delete for " + sponsorKey + " until end of traversal");
            }
        }
        finally {
            activeAccountKeys.delete(sponsorKey);
        }
    };
    if (!signerKey) {
        throw new Error("deleteAccountTree requires a connected signer.");
    }
    if (!accountKeySet.has(signerKey)) {
        (_d = (_c = this.logger) === null || _c === void 0 ? void 0 : _c.logDetail) === null || _d === void 0 ? void 0 : _d.call(_c, "JS => deleteAccountTree signer tree not found for " + signerKey + "; nothing to delete");
        return summary;
    }
    if (!processedAccountKeys.has(signerKey)) {
        await walkAccountTree(signerKey, false);
    }
    (_d = (_c = this.logger) === null || _c === void 0 ? void 0 : _c.logDetail) === null || _d === void 0 ? void 0 : _d.call(_c, "JS => deleteAccountTree summary = " + JSON.stringify(summary));
    return summary;
}
