// @ts-nocheck
export const addRecipient = async (context, _recipientKey) => {
    context.spCoinLogger.logFunctionHeader("addRecipient = async(" + _recipientKey + ")");
    context.spCoinLogger.logDetail("JS => Inserting " + _recipientKey + " Recipient To Blockchain Network");
    context.spCoinLogger.logDetail("JS => Inserting Recipient " + _recipientKey);
    const tx = await context.spCoinContractDeployed.addRecipient(_recipientKey);
    context.spCoinLogger.logExitFunction();
    return tx;
};

