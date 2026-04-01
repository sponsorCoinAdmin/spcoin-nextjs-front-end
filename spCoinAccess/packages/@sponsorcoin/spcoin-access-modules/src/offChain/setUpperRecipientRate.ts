// @ts-nocheck
/**
 * SponsorCoin Access Modules
 * File: dist/offChain/setUpperRecipientRate.js
 * Role: Off-chain helper that updates the upper recipient rate through the on-chain processor.
 */
export async function setUpperRecipientRate(newUpperRecipientRate) {
    if (typeof (this.contract === null || this.contract === void 0 ? void 0 : this.contract.getLowerRecipientRate) !== "function" || typeof (this.contract === null || this.contract === void 0 ? void 0 : this.contract.setRecipientRateRange) !== "function") {
        throw new Error("Recipient rate methods are not available on the current SpCoin contract.");
    }
    const lowerRecipientRate = await this.contract.getLowerRecipientRate();
    return this.contract.setRecipientRateRange(lowerRecipientRate, newUpperRecipientRate);
}
