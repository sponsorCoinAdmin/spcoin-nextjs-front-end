// @ts-nocheck
export const addRecipientSponsoredTransaction = async (context, _sponsorKey, _recipientKey, _recipientRateKey, _transactionQty) => {
    context.spCoinLogger.logFunctionHeader(
        "addRecipientSponsoredTransaction = async(" + _sponsorKey + ", " + _recipientKey + ", " + _recipientRateKey + ", " + _transactionQty + ")"
    );
    const components = String(_transactionQty ?? "").split(".");
    const wholePart = components[0].length > 0 ? components[0] : "0";
    const fractionalPart = components.length > 1 ? components[1] : "0";
    const contractMethod = context.spCoinContractDeployed.addRecipientRateBranchAmount
        ?? context.spCoinContractDeployed.addRecipientSponsoredTransaction
        ?? context.spCoinContractDeployed.addRecipientRateTransaction
        ;
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
