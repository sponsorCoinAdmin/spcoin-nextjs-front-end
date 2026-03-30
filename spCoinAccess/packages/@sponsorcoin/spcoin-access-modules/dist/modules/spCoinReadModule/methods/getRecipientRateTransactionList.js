// @ts-nocheck
export async function getRecipientRateTransactionList(context, _sponsorCoin, _recipientKey, _recipientRateKey) {
    context.spCoinLogger.logFunctionHeader("getRecipientRateTransactionList = async(" + _recipientKey + ", " + _recipientRateKey + ")");
    let agentRateTransactionList = "";
    try {
        agentRateTransactionList = await context.spCoinContractDeployed.getRecipientRateTransactionList(_sponsorCoin, _recipientKey, _recipientRateKey);
    }
    catch (_error) {
        agentRateTransactionList = "";
    }
    context.spCoinLogger.logExitFunction();
    return context.spCoinSerialize.deserializeRateTransactionRecords(agentRateTransactionList);
}
