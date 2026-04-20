// @ts-nocheck
export async function getRecipientRateTransactionList(context, _sponsorKey, _recipientKey) {
    const runtime = context;
    runtime.spCoinLogger.logFunctionHeader("getRecipientRateTransactionList = async(" + _sponsorKey + "," + _recipientKey + ")");
    const networkRateList = await runtime.getRecipientRateList(_sponsorKey, _recipientKey);
    const recipientRateTransactionList = [];
    for (const [, recipientRateKey] of Object.entries(networkRateList)) {
        const recipientRateTransaction = await runtime.getRecipientRateTransaction(_sponsorKey, _recipientKey, recipientRateKey);
        recipientRateTransactionList.push(recipientRateTransaction);
    }
    runtime.spCoinLogger.logExitFunction();
    return recipientRateTransactionList;
}

