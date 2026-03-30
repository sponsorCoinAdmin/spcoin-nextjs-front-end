// @ts-nocheck
export const updateAccountStakingRewards = async (context, accountKey) => {
    context.spCoinLogger.logFunctionHeader("updateAccountStakingRewards(accountKey)");
    const tx = await context.spCoinContractDeployed.updateAccountStakingRewards(accountKey);
    context.spCoinLogger.logExitFunction();
    return tx;
};

