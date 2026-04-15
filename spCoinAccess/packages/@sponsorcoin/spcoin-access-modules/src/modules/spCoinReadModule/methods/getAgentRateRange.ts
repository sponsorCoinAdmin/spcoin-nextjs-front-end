// @ts-nocheck
export async function getAgentRateRange(context) {
    const [lower, upper] = await Promise.all([
        context.spCoinContractDeployed.getLowerAgentRate(),
        context.spCoinContractDeployed.getUpperAgentRate(),
    ]);
    return [lower, upper];
}
