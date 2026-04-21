// @ts-nocheck
export const addRecipientTransaction = async (context, _sponsorKey, _recipientKey, _recipientRateKey, _transactionQty) => {
    context.spCoinLogger.logFunctionHeader(
        "addRecipientTransaction = async(" + _sponsorKey + ", " + _recipientKey + ", " + _recipientRateKey + ", " + _transactionQty + ")"
    );
    const components = String(_transactionQty ?? "").split(".");
    const wholePart = components[0].length > 0 ? components[0] : "0";
    const fractionalPart = components.length > 1 ? components[1] : "0";
    const contractMethod = context.spCoinContractDeployed.addRecipientRateTransaction
        ?? context.spCoinContractDeployed.addRecipientTransaction;
    const tx = await contractMethod(
        _sponsorKey,
        _recipientKey,
        _recipientRateKey,
        wholePart,
        fractionalPart
    );
    context.spCoinLogger.logExitFunction();
    return tx;
};
