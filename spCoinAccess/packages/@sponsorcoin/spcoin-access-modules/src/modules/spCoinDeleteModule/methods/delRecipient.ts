// @ts-nocheck
export const delRecipient = async (context, _sponsorKey, _recipientKey) => {
    context.spCoinLogger.logFunctionHeader("delRecipient(" + _sponsorKey.accountKey + ", " + _recipientKey + ")");
    const tx = await context.spCoinContractDeployed.connect(context.signer).delRecipient(_sponsorKey.accountKey, _recipientKey);
    context.spCoinLogger.logExitFunction();
    return tx;
};
