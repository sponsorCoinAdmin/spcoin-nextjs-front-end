// @ts-nocheck
/**
 * SponsorCoin Access Modules
 * File: dist/offChain/deleteAccountTree.js
 * Role: Off-chain helper that removes sponsor-recipient relationships from live on-chain state.
 */
export async function deleteAccountTree() {
    var _a, _b, _c, _d, _e, _f, _g;
    const read = (_a = this.onChain) === null || _a === void 0 ? void 0 : _a.read;
    const deleteMethods = (_b = this.onChain) === null || _b === void 0 ? void 0 : _b.delete;
    if (!read || !deleteMethods) {
        throw new Error("deleteAccountTree requires onChain read and delete access.");
    }
    if (typeof read.getAccountRecipientList !== "function") {
        throw new Error("deleteAccountTree requires getAccountRecipientList on the onChain read processor.");
    }
    if (typeof deleteMethods.deleteAccountRecord !== "function") {
        throw new Error("deleteAccountTree requires deleteAccountRecord on the onChain delete processor.");
    }
    const summary = {
        accountCount: 0,
        recipientCount: 0,
        deletedRecipientCount: 0,
        deletedAccountCount: 0,
    };
    const signerKey = String((((_c = this.onChain) === null || _c === void 0 ? void 0 : _c.delete) === null || (_d = (_c = this.onChain) === null || _c === void 0 ? void 0 : _c.delete) === void 0 ? void 0 : _d.signer) && (((_e = this.onChain) === null || _e === void 0 ? void 0 : _e.delete.signer.address) || "") || "").trim();
    const countedAccountKeys = new Set();
    const processedAccountKeys = new Set();
    const activeAccountKeys = new Set();
    const sleep = async (ms) => await new Promise((resolve) => setTimeout(resolve, ms));
    const isRetryableTransportError = (error) => {
        const text = String((error === null || error === void 0 ? void 0 : error.message) || error || "").toLowerCase();
        return (text.includes("failed to fetch") ||
            text.includes("fetchrequest.geturl") ||
            text.includes("network error") ||
            text.includes("timeout") ||
            text.includes("socket hang up") ||
            text.includes("missing response") ||
            text.includes("could not coalesce error"));
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
                (_g = (_f = this.logger) === null || _f === void 0 ? void 0 : _f.logDetail) === null || _g === void 0 ? void 0 : _g.call(_f, "JS => deleteAccountTree " + label + " retry #" + String(attempt) + " after transport error: " + String((error === null || error === void 0 ? void 0 : error.message) || error));
                await sleep(delayMs * attempt);
            }
        }
        throw lastError;
    };
    const isLiveAccount = async (accountKey) => {
        if (typeof read.isAccountInserted === "function") {
            try {
                return Boolean(await callWithRetry("isAccountInserted(" + accountKey + ")", () => read.isAccountInserted(accountKey)));
            }
            catch (_h) {
                return false;
            }
        }
        return true;
    };
    const getLiveRecipientList = async (sponsorKey) => {
        if (!(await isLiveAccount(sponsorKey)))
            return [];
        const result = await callWithRetry("getAccountRecipientList(" + sponsorKey + ")", () => read.getAccountRecipientList(sponsorKey));
        return Array.isArray(result) ? result.map((value) => String(value)) : [];
    };
    const deleteLiveSponsorTree = async (sponsorKey, isRoot = false) => {
        var _h, _j;
        if (processedAccountKeys.has(sponsorKey)) {
            return;
        }
        if (!(await isLiveAccount(sponsorKey))) {
            processedAccountKeys.add(sponsorKey);
            return;
        }
        if (!countedAccountKeys.has(sponsorKey)) {
            countedAccountKeys.add(sponsorKey);
            summary.accountCount += 1;
        }
        if (activeAccountKeys.has(sponsorKey)) {
            (_j = (_h = this.logger) === null || _h === void 0 ? void 0 : _h.logDetail) === null || _j === void 0 ? void 0 : _j.call(_h, "JS => deleteAccountTree skipping recursive cycle for " + sponsorKey);
            return;
        }
        activeAccountKeys.add(sponsorKey);
        try {
            let recipientList = await getLiveRecipientList(sponsorKey);
            while (recipientList.length > 0) {
                const recipientKey = String(recipientList[0]);
                summary.recipientCount += 1;
                if (await isLiveAccount(recipientKey)) {
                    await deleteLiveSponsorTree(recipientKey, false);
                }
                const refreshedRecipientList = await getLiveRecipientList(sponsorKey);
                const relationshipStillExists = refreshedRecipientList.some((value) => value.toLowerCase() === recipientKey.toLowerCase());
                if (relationshipStillExists) {
                    await callWithRetry("deleteRecipient(" + sponsorKey + "," + recipientKey + ")", () => deleteMethods.deleteRecipient({ accountKey: sponsorKey }, recipientKey));
                    summary.deletedRecipientCount += 1;
                    await sleep(200);
                }
                recipientList = await getLiveRecipientList(sponsorKey);
            }
            if (isRoot && (await isLiveAccount(sponsorKey))) {
                await callWithRetry("deleteAccountRecord(" + sponsorKey + ")", () => deleteMethods.deleteAccountRecord(sponsorKey));
                summary.deletedAccountCount += 1;
                await sleep(200);
            }
            processedAccountKeys.add(sponsorKey);
        }
        finally {
            activeAccountKeys.delete(sponsorKey);
        }
    };
    if (!signerKey) {
        throw new Error("deleteAccountTree requires a connected signer.");
    }
    if (!(await isLiveAccount(signerKey))) {
        (_g = (_f = this.logger) === null || _f === void 0 ? void 0 : _f.logDetail) === null || _g === void 0 ? void 0 : _g.call(_f, "JS => deleteAccountTree signer tree not found for " + signerKey + "; nothing to delete");
        return summary;
    }
    await deleteLiveSponsorTree(signerKey, true);
    (_g = (_f = this.logger) === null || _f === void 0 ? void 0 : _f.logDetail) === null || _g === void 0 ? void 0 : _g.call(_f, "JS => deleteAccountTree summary = " + JSON.stringify(summary));
    return summary;
}
