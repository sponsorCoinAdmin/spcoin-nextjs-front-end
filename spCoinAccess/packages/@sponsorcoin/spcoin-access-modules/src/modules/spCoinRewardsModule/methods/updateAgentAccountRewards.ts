// @ts-nocheck
export const updateAgentAccountRewards = async (context, accountKey) => {
    context.spCoinLogger.logFunctionHeader("updateAgentAccountRewards(accountKey)");
    const tx = await context.spCoinContractDeployed.updateAgentAccountRewards(accountKey);
    context.spCoinLogger.logExitFunction();
    return tx;
};
