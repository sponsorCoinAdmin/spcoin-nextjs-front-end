// @ts-nocheck
export const unSponsorRecipient = async (context, _sponsorKey, _recipientKey) => {
    context.spCoinLogger.logFunctionHeader("deleteRecipient(" + _sponsorKey.accountKey + ", " + _recipientKey + ")");
    const tx = await context.spCoinContractDeployed.connect(context.signer).deleteRecipient(_sponsorKey.accountKey, _recipientKey);
    context.spCoinLogger.logExitFunction();
    return tx;
};
