// @ts-nocheck
export const backDateAgentTransactionDate = async (
    context,
    _adminSigner,
    _sponsorKey,
    _recipientKey,
    _recipientRateKey,
    _accountAgentKey,
    _agentRateKey,
    _transactionIndex,
    _transactionBackDate
) => {
    context.spCoinLogger.logFunctionHeader(
        "backDateAgentTransactionDate = async(" +
            _sponsorKey + ", " +
            _recipientKey + ", " +
            _recipientRateKey + ", " +
            _accountAgentKey + ", " +
            _agentRateKey + ", " +
            _transactionIndex + ", " +
            _transactionBackDate + ")"
    );
    const ownerAddress = await context.spCoinContractDeployed.owner();
    const signerAddress = typeof _adminSigner?.getAddress === "function"
        ? await _adminSigner.getAddress()
        : _adminSigner?.address;
    if (!signerAddress || String(signerAddress).toLowerCase() !== String(ownerAddress).toLowerCase()) {
        throw new Error("backdating transaction dates requires the owner signer.");
    }
    const tx = await context.spCoinContractDeployed.backDateTransactionDate(
        _sponsorKey,
        _recipientKey,
        _recipientRateKey,
        _accountAgentKey,
        _agentRateKey,
        _transactionIndex,
        _transactionBackDate
    );
    context.spCoinLogger.logExitFunction();
    return tx;
};
