// @ts-nocheck
/**
 * SponsorCoin Access Modules
 * File: dist/offChain/addAgents.js
 * Role: Off-chain helper that batches multiple on-chain addAgent calls.
 */
export async function addAgents(sponsorKey, recipientKey, recipientRateKey, agentAccountList) {
    var _a, _b;
    const addAgent = (_b = (_a = this.onChain) === null || _a === void 0 ? void 0 : _a.add) === null || _b === void 0 ? void 0 : _b.addAgent;
    if (typeof addAgent !== "function") {
        throw new Error("addAgent is not available on the current SpCoin onChain processor.");
    }
    let agentCount = 0;
    for (const agentKey of agentAccountList) {
        await addAgent(String(sponsorKey), String(recipientKey), recipientRateKey, String(agentKey));
        agentCount += 1;
    }
    return agentCount;
}
