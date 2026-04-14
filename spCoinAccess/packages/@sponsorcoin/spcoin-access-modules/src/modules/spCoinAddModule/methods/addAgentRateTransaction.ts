// @ts-nocheck
export const addAgentRateTransaction = async (
    context,
    _sponsorKey,
    _recipientKey,
    _recipientRateKey,
    _accountAgentKey,
    _agentRateKey,
    _transactionQty
) => {
    context.spCoinLogger.logFunctionHeader(
        "addAgentRateTransaction = async(" +
            _sponsorKey + ", " +
            _recipientKey + ", " +
            _recipientRateKey + ", " +
            _accountAgentKey + ", " +
            _agentRateKey + ", " +
            _transactionQty + ")"
    );
    const components = String(_transactionQty ?? "").split(".");
    const wholePart = components[0].length > 0 ? components[0] : "0";
    const fractionalPart = components.length > 1 ? components[1] : "0";
    const tx = await context.spCoinContractDeployed.addAgentRateTransaction(
        _sponsorKey,
        _recipientKey,
        _recipientRateKey,
        _accountAgentKey,
        _agentRateKey,
        wholePart,
        fractionalPart
    );
    context.spCoinLogger.logExitFunction();
    return tx;
};
