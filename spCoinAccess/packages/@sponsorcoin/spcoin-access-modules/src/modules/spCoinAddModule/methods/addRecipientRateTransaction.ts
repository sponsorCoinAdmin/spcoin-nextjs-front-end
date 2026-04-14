// @ts-nocheck
export const addRecipientRateTransaction = async (context, _sponsorKey, _recipientKey, _recipientRateKey, _transactionQty) => {
    context.spCoinLogger.logFunctionHeader(
        "addRecipientRateTransaction = async(" + _sponsorKey + ", " + _recipientKey + ", " + _recipientRateKey + ", " + _transactionQty + ")"
    );
    const components = String(_transactionQty ?? "").split(".");
    const wholePart = components[0].length > 0 ? components[0] : "0";
    const fractionalPart = components.length > 1 ? components[1] : "0";
    const tx = await context.spCoinContractDeployed.addRecipientRateTransaction(
        _sponsorKey,
        _recipientKey,
        _recipientRateKey,
        wholePart,
        fractionalPart
    );
    context.spCoinLogger.logExitFunction();
    return tx;
};
