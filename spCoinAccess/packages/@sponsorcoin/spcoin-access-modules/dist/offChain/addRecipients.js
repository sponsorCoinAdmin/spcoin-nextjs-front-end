// @ts-nocheck
/**
 * SponsorCoin Access Modules
 * File: dist/offChain/addRecipients.js
 * Role: Off-chain helper that batches multiple on-chain addRecipient calls.
 */
export async function addRecipients(_accountKey, recipientAccountList) {
    var _a, _b;
    const addRecipient = (_b = (_a = this.onChain) === null || _a === void 0 ? void 0 : _a.add) === null || _b === void 0 ? void 0 : _b.addRecipient;
    if (typeof addRecipient !== "function") {
        throw new Error("addRecipient is not available on the current SpCoin onChain processor.");
    }
    let recipientCount = 0;
    for (const recipientKey of recipientAccountList) {
        await addRecipient(String(recipientKey));
        recipientCount += 1;
    }
    return recipientCount;
}
