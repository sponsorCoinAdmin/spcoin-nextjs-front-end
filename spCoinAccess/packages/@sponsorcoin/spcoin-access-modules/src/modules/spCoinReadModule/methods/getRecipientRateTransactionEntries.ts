// @ts-nocheck
export async function getRecipientRateTransactionEntries(context, _sponsorCoin, _recipientKey, _recipientRateKey) {
    context.spCoinLogger.logFunctionHeader("getRecipientRateTransactionEntries = async(" + _recipientKey + ", " + _recipientRateKey + ")");
    let agentRateTransactionList = "";
    try {
        const transactionCount = await context.spCoinContractDeployed.getRecipientRateTransactionCount(_sponsorCoin, _recipientKey, _recipientRateKey);
        const transactionRows = [];
        for (let transactionIndex = 0; transactionIndex < Number(transactionCount || 0); transactionIndex++) {
            const [insertionTime, stakingRewards] = await context.spCoinContractDeployed.getRecipientRateTransactionAt(_sponsorCoin, _recipientKey, _recipientRateKey, transactionIndex);
            transactionRows.push(String(insertionTime) + "," + String(stakingRewards));
        }
        agentRateTransactionList = transactionRows.join("\n");
    }
    catch (_error) {
        agentRateTransactionList = "";
    }
    context.spCoinLogger.logExitFunction();
    return context.spCoinSerialize.deserializeRateTransactionRecords(agentRateTransactionList);
}
