// @ts-nocheck
export async function getAccountListSize(context) {
    const runtime = context;
    runtime.spCoinLogger.logFunctionHeader("getAccountListSize = async()");
    const maxSize = (await runtime.getAccountList()).length;
    runtime.spCoinLogger.logDetail("JS => Found " + maxSize + " Account Keys");
    runtime.spCoinLogger.logExitFunction();
    return maxSize;
}
