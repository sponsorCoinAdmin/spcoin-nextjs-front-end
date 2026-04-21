// @ts-nocheck
export async function getAgentTransactionEntries(context, _sponsorCoin, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey) {
    context.spCoinLogger.logFunctionHeader("getAgentTransactionEntries = async(" + _recipientKey + ", " + _recipientRateKey + ", " + _agentKey + ", " + _agentRateKey + ")");
    let agentTransactionList = "";
    try {
        agentTransactionList = await context.spCoinContractDeployed.getSerializedTransactionList(_sponsorCoin, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey);
    }
    catch (_error) {
        agentTransactionList = "";
    }
    context.spCoinLogger.logExitFunction();
    return context.spCoinSerialize.deserializeTransactionRecords(agentTransactionList);
}
