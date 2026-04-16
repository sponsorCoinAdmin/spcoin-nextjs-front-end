// @ts-nocheck
export const addRecipientAgent = async (context, _sponsorKey, _recipientKey, _recipientRateKey, _accountAgentKey) => {
    context.spCoinLogger.logFunctionHeader("addRecipientAgent = async(" + _sponsorKey + ", " + _recipientKey + ", " + _recipientRateKey + ", " + _accountAgentKey + ")");
    context.spCoinLogger.logDetail("JS => Adding Agent " + _accountAgentKey + " To Blockchain Network");
    context.spCoinLogger.logDetail("JS =>  " + "Inserting Agent[" + _recipientKey + "]: " + _accountAgentKey);
    const tx = await context.spCoinContractDeployed.addRecipientAgent(_sponsorKey, _recipientKey, _recipientRateKey, _accountAgentKey);
    context.spCoinLogger.logDetail("JS => " + "Added Agent " + _accountAgentKey + " Record to RecipientKey " + _recipientKey);
    context.spCoinLogger.logExitFunction();
    return tx;
};

