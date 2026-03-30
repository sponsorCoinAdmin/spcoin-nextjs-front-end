// @ts-nocheck
export async function getAccountRecipientListSize(context, _accountKey) {
    const runtime = context;
    runtime.spCoinLogger.logFunctionHeader("getAccountRecipientListSize = async(" + _accountKey + ")");
    const maxSize = (await runtime.getAccountRecipientList(_accountKey)).length;
    runtime.spCoinLogger.logDetail("JS => Found " + maxSize + " Account Recipient Keys");
    runtime.spCoinLogger.logExitFunction();
    return maxSize;
}
