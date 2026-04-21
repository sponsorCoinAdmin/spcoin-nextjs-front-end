// @ts-nocheck
export async function getRecipientTransactionEntries(context, _sponsorCoin, _recipientKey, _recipientRateKey) {
    context.spCoinLogger.logFunctionHeader("getRecipientTransactionEntries = async(" + _recipientKey + ", " + _recipientRateKey + ")");
    let agentTransactionList = "";
    try {
        const transactionCount = await context.spCoinContractDeployed.getRecipientTransactionCount(_sponsorCoin, _recipientKey, _recipientRateKey);
        const transactionRows = [];
        for (let transactionIndex = 0; transactionIndex < Number(transactionCount || 0); transactionIndex++) {
            const [insertionTime, stakingRewards] = await context.spCoinContractDeployed.getRecipientTransactionAt(_sponsorCoin, _recipientKey, _recipientRateKey, transactionIndex);
            transactionRows.push(String(insertionTime) + "," + String(stakingRewards));
        }
        agentTransactionList = transactionRows.join("\n");
    }
    catch (_error) {
        agentTransactionList = "";
    }
    context.spCoinLogger.logExitFunction();
    return context.spCoinSerialize.deserializeTransactionRecords(agentTransactionList);
}
