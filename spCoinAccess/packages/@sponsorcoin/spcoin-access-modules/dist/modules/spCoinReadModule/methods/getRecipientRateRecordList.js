// @ts-nocheck
export async function getRecipientRateRecordList(context, _sponsorKey, _recipientKey) {
    const runtime = context;
    runtime.spCoinLogger.logFunctionHeader("getRecipientRateRecordList = async(" + _sponsorKey + "," + _recipientKey + ")");
    const networkRateList = await runtime.getRecipientRateList(_sponsorKey, _recipientKey);
    const recipientRateRecordList = [];
    for (const [, recipientRateKey] of Object.entries(networkRateList)) {
        const recipientRateRecord = await runtime.getRecipientRateRecord(_sponsorKey, _recipientKey, recipientRateKey);
        recipientRateRecordList.push(recipientRateRecord);
    }
    runtime.spCoinLogger.logExitFunction();
    return recipientRateRecordList;
}
