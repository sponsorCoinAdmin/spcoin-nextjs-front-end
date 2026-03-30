// @ts-nocheck
export async function getOffLineAccountRecords(context) {
    const runtime = context;
    runtime.spCoinLogger.logFunctionHeader("getOffLineAccountRecords()");
    const accountArr = [];
    const accountList = await runtime.getAccountList();
    for (let i in accountList) {
        const accountStruct = await runtime.getAccountRecord(accountList[i]);
        accountArr.push(accountStruct);
    }
    runtime.spCoinLogger.logExitFunction();
    return accountArr;
}
