// @ts-nocheck
export const addAgentTransaction = async (
    context,
    _sponsorKey,
    _recipientKey,
    _recipientRateKey,
    _accountAgentKey,
    _agentRateKey,
    _transactionQty
) => {
    context.spCoinLogger.logFunctionHeader(
        "addAgentTransaction = async(" +
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
    const contractMethod = context.spCoinContractDeployed.addAgentTransaction
        ?? context.spCoinContractDeployed.addAgentRateTransaction;
    const tx = await contractMethod(
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
