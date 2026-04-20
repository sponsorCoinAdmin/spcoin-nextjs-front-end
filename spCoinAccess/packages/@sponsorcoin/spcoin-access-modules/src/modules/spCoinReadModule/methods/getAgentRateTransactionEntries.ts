// @ts-nocheck
export async function getAgentRateTransactionEntries(context, _sponsorCoin, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey) {
    context.spCoinLogger.logFunctionHeader("getAgentRateTransactionEntries = async(" + _recipientKey + ", " + _recipientRateKey + ", " + _agentKey + ", " + _agentRateKey + ")");
    let agentRateTransactionList = "";
    try {
        const transactionCount = await context.spCoinContractDeployed.getAgentRateTransactionCount(_sponsorCoin, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey);
        const transactionRows = [];
        for (let transactionIndex = 0; transactionIndex < Number(transactionCount || 0); transactionIndex++) {
            const [insertionTime, stakingRewards] = await context.spCoinContractDeployed.getAgentRateTransactionAt(_sponsorCoin, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey, transactionIndex);
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
