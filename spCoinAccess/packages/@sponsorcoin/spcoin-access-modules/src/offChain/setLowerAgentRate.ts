// @ts-nocheck
/**
 * SponsorCoin Access Modules
 * File: dist/offChain/setLowerAgentRate.js
 * Role: Off-chain helper that updates the lower agent rate through the on-chain processor.
 */
export async function setLowerAgentRate(newLowerAgentRate) {
    if (typeof (this.contract === null || this.contract === void 0 ? void 0 : this.contract.getUpperAgentRate) !== "function" || typeof (this.contract === null || this.contract === void 0 ? void 0 : this.contract.setAgentRateRange) !== "function") {
        throw new Error("Agent rate methods are not available on the current SpCoin contract.");
    }
    const upperAgentRate = await this.contract.getUpperAgentRate();
    return this.contract.setAgentRateRange(newLowerAgentRate, upperAgentRate);
}
