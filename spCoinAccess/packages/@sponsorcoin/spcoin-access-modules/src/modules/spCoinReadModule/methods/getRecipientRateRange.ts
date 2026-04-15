// @ts-nocheck
export async function getRecipientRateRange(context) {
    const [lower, upper] = await Promise.all([
        context.spCoinContractDeployed.getLowerRecipientRate(),
        context.spCoinContractDeployed.getUpperRecipientRate(),
    ]);
    return [lower, upper];
}
