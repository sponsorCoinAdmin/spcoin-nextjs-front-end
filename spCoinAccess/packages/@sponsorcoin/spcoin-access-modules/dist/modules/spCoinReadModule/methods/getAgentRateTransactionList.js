export async function getAgentRateTransactionList(context, _sponsorCoin, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey) {
    context.spCoinLogger.logFunctionHeader("getAgentRateTransactionList = async(" + _recipientKey + ", " + _recipientRateKey + ", " + _agentKey + ", " + _agentRateKey + ")");
    let agentRateTransactionList = "";
    try {
        agentRateTransactionList = await context.spCoinContractDeployed.getSerializedRateTransactionList(_sponsorCoin, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey);
    }
    catch (_error) {
        agentRateTransactionList = "";
    }
    context.spCoinLogger.logExitFunction();
    return context.spCoinSerialize.deserializeRateTransactionRecords(agentRateTransactionList);
}
