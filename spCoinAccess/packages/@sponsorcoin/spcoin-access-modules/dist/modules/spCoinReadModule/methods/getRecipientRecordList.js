export async function getRecipientRecordList(context, _sponsorKey, _recipientAccountList) {
    const runtime = context;
    runtime.spCoinLogger.logFunctionHeader("getRecipientRecordList = async(" + _sponsorKey + "," + _recipientAccountList + ")");
    const recipientRecordList = [];
    for (const [, recipientKey] of Object.entries(_recipientAccountList)) {
        runtime.spCoinLogger.logDetail("JS => Loading Recipient Record " + recipientKey);
        const recipientRecord = await runtime.getRecipientRecord(_sponsorKey, recipientKey);
        recipientRecordList.push(recipientRecord);
    }
    runtime.spCoinLogger.logExitFunction();
    return recipientRecordList;
}
