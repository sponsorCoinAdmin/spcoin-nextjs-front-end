export async function getAccountRecipientList(context, _accountKey) {
    context.spCoinLogger.logFunctionHeader("getAccountRecipientList = async(" + _accountKey + ")");
    const recipientAccountList = await context.spCoinContractDeployed.getAccountRecipientList(_accountKey);
    context.spCoinLogger.logExitFunction();
    return recipientAccountList;
}
