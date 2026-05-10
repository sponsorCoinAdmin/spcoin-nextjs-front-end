// @ts-nocheck
export const updateSponsorAccountRewards = async (context, accountKey) => {
    context.spCoinLogger.logFunctionHeader("updateSponsorAccountRewards(accountKey)");
    const tx = await context.spCoinContractDeployed.updateSponsorAccountRewards(accountKey);
    context.spCoinLogger.logExitFunction();
    return tx;
};
