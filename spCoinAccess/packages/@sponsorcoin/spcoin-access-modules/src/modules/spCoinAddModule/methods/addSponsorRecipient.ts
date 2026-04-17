// @ts-nocheck
export const addSponsorRecipient = async (context, _sponsorKey, _recipientKey) => {
    context.spCoinLogger.logFunctionHeader("addSponsorRecipient = async(" + _sponsorKey + ", " + _recipientKey + ")");
    const tx =
        typeof context.spCoinContractDeployed.addSponsorRecipient === "function"
            ? await context.spCoinContractDeployed.addSponsorRecipient(_sponsorKey, _recipientKey)
            : await context.spCoinContractDeployed.addRecipient(_recipientKey);
    context.spCoinLogger.logExitFunction();
    return tx;
};

