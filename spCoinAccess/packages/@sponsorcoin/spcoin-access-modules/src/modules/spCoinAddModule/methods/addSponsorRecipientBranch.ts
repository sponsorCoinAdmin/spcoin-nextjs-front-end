// @ts-nocheck
export const addSponsorRecipientBranch = async (context, _sponsorKey, _recipientKey) => {
    context.spCoinLogger.logFunctionHeader("addSponsorRecipientBranch = async(" + _sponsorKey + ", " + _recipientKey + ")");
    const tx = await context.spCoinContractDeployed.addSponsorRecipientBranch(_sponsorKey, _recipientKey);
    context.spCoinLogger.logExitFunction();
    return tx;
};

