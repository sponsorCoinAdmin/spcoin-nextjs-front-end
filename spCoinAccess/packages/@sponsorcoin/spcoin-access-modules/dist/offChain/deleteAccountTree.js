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
    const processedAccountKeys = new Set();
    const activeAccountKeys = new Set();
    const walkAccountTree = async (sponsorKey) => {
        var _a, _b;
        if (processedAccountKeys.has(sponsorKey)) {
            return;
        }
        if (activeAccountKeys.has(sponsorKey)) {
            (_b = (_a = this.logger) === null || _a === void 0 ? void 0 : _a.logDetail) === null || _b === void 0 ? void 0 : _b.call(_a, "JS => deleteAccountTree skipping recursive cycle for " + sponsorKey);
            return;
        }
        activeAccountKeys.add(sponsorKey);
        try {
            summary.accountCount += 1;
            const recipientList = await read.getAccountRecipientList(sponsorKey);
            for (const recipientKeyValue of Array.isArray(recipientList) ? recipientList : []) {
                const recipientKey = String(recipientKeyValue);
                summary.recipientCount += 1;
                if (accountKeySet.has(recipientKey)) {
                    await walkAccountTree(recipientKey);
                }
                const recipientRateList = await read.getRecipientRateList(sponsorKey, recipientKey);
                for (const recipientRateKey of Array.isArray(recipientRateList) ? recipientRateList : []) {
                    summary.recipientRateCount += 1;
                    const agentList = await read.getRecipientRateAgentList(sponsorKey, recipientKey, recipientRateKey);
                    for (const agentKeyValue of Array.isArray(agentList) ? agentList : []) {
                        const agentKey = String(agentKeyValue);
                        summary.agentCount += 1;
                        if (typeof deleteMethods.deleteAgentRecord === "function") {
                            await deleteMethods.deleteAgentRecord(sponsorKey, recipientKey, agentKey);
                            summary.deletedAgentCount += 1;
                        }
                    }
                }
                if (typeof deleteMethods.unSponsorRecipient === "function") {
                    await deleteMethods.unSponsorRecipient({ accountKey: sponsorKey }, recipientKey);
                    summary.deletedRecipientCount += 1;
                }
            }
            await deleteMethods.deleteAccountRecord(sponsorKey);
            summary.deletedAccountCount += 1;
            processedAccountKeys.add(sponsorKey);
        }
        finally {
            activeAccountKeys.delete(sponsorKey);
        }
    };
    for (const sponsorKey of accountKeySet) {
        await walkAccountTree(sponsorKey);
    }
    (_d = (_c = this.logger) === null || _c === void 0 ? void 0 : _c.logDetail) === null || _d === void 0 ? void 0 : _d.call(_c, "JS => deleteAccountTree summary = " + JSON.stringify(summary));
    return summary;
}
