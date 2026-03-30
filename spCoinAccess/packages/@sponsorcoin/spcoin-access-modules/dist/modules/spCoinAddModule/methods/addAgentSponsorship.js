// @ts-nocheck
export const addAgentSponsorship = async (context, _sponsorSigner, _recipientKey, _recipientRateKey, _accountAgentKey, _agentRateKey, _transactionQty) => {
    context.spCoinLogger.logFunctionHeader("addAgentSponsorship = async(" +
        _sponsorSigner + ", " +
        _recipientKey + ", " +
        _recipientRateKey + ", " +
        _accountAgentKey + ", " +
        _agentRateKey + ", " +
        _transactionQty + ")");
    const components = _transactionQty.toString().split(".");
    const wholePart = components[0].length > 0 ? components[0] : "0";
    const fractionalPart = components.length > 1 ? components[1] : "0";
    const tx = await context.spCoinContractDeployed.connect(_sponsorSigner).addSponsorship(_recipientKey, _recipientRateKey, _accountAgentKey, _agentRateKey, wholePart, fractionalPart);
    context.spCoinLogger.logExitFunction();
    return tx;
};
