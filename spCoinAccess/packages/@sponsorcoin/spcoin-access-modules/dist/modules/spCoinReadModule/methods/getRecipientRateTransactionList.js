// @ts-nocheck
export async function getRecipientTransactionList(context, _sponsorCoin, _recipientKey, _recipientRateKey) {
    context.spCoinLogger.logFunctionHeader("getRecipientTransactionList = async(" + _recipientKey + ", " + _recipientRateKey + ")");
    let agentTransactionList = "";
    try {
        agentTransactionList = await context.spCoinContractDeployed.getRecipientTransactionList(_sponsorCoin, _recipientKey, _recipientRateKey);
    }
    catch (_error) {
        agentTransactionList = "";
    }
    context.spCoinLogger.logExitFunction();
    return context.spCoinSerialize.deserializeTransactionRecords(agentTransactionList);
}
