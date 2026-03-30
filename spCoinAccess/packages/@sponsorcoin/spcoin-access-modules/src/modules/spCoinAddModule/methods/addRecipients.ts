// @ts-nocheck
export const addRecipients = async (context, _accountKey, _recipientAccountList) => {
    context.spCoinLogger.logFunctionHeader("addRecipients = async(" + _accountKey + ", " + _recipientAccountList + ")");
    context.spCoinLogger.logDetail("JS => For Account[" + _accountKey + "]: " + _accountKey + ")");
    context.spCoinLogger.logDetail("JS => Adding " + _recipientAccountList.length + " Recipient To Blockchain Network");
    let recipientCount = 0;
    for (recipientCount; recipientCount < _recipientAccountList.length; recipientCount++) {
        const _recipientKey = _recipientAccountList[recipientCount];
        await context.addRecipient(_recipientKey);
    }
    context.spCoinLogger.logDetail("JS => Inserted = " + recipientCount + " Recipient Records");
    context.spCoinLogger.logExitFunction();
    return recipientCount;
};

