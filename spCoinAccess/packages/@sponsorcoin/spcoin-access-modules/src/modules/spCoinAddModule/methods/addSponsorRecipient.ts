// @ts-nocheck
export const addSponsorRecipient = async (context, _sponsorKey, _recipientKey) => {
    context.spCoinLogger.logFunctionHeader("addSponsorRecipient = async(" + _sponsorKey + ", " + _recipientKey + ")");
    const tx = await context.spCoinContractDeployed.addSponsorRecipient(_sponsorKey, _recipientKey);
    context.spCoinLogger.logExitFunction();
    return tx;
};

