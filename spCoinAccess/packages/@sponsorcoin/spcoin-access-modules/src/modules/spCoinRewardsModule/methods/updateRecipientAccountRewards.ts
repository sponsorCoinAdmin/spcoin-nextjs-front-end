// @ts-nocheck
export const updateRecipientAccountRewards = async (context, accountKey) => {
    context.spCoinLogger.logFunctionHeader("updateRecipientAccountRewards(accountKey)");
    const tx = await context.spCoinContractDeployed.updateRecipientAccountRewards(accountKey);
    context.spCoinLogger.logExitFunction();
    return tx;
};
