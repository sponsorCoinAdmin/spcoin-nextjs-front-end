export const addBackDatedAgentSponsorship = async (context, _adminSigner, _sponsorKey, _recipientKey, _recipientRateKey, _accountAgentKey, _agentRateKey, _transactionQty, _transactionBackDate) => {
    context.spCoinLogger.logFunctionHeader("addBackDatedAgentSponsorship = async(" +
        _adminSigner + ", " +
        _sponsorKey + ", " +
        _recipientKey + ", " +
        _recipientRateKey + ", " +
        _accountAgentKey + ", " +
        _agentRateKey + ", " +
        _transactionQty + ", " +
        _transactionBackDate + ")");
    _transactionBackDate = Math.trunc(_transactionBackDate);
    const components = _transactionQty.toString().split(".");
    const wholePart = components[0].length > 0 ? components[0] : "0";
    const fractionalPart = components.length > 1 ? components[1] : "0";
    const tx = await context.spCoinContractDeployed.connect(_adminSigner).addBackDatedSponsorship(_sponsorKey, _recipientKey, _recipientRateKey, _accountAgentKey, _agentRateKey, wholePart, fractionalPart, _transactionBackDate);
    context.spCoinLogger.logExitFunction();
    return tx;
};
