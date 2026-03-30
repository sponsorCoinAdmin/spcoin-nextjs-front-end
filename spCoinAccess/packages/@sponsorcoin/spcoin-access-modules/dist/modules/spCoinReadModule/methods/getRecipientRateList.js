// @ts-nocheck
export async function getRecipientRateList(context, _sponsorKey, _recipientKey) {
    context.spCoinLogger.logFunctionHeader("getRecipientRateList = async(" + _sponsorKey + "," + _recipientKey + ")");
    const networkRateKeys = await context.spCoinContractDeployed.getRecipientRateList(_sponsorKey, _recipientKey);
    const recipientRateList = [];
    for (const [, netWorkRateKey] of Object.entries(networkRateKeys)) {
        recipientRateList.push(netWorkRateKey);
    }
    context.spCoinLogger.logExitFunction();
    return recipientRateList;
}
