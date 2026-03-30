// @ts-nocheck
export async function getAccountList(context) {
    context.spCoinLogger.logFunctionHeader("getAccountList = async()");
    const insertedAccountList = await context.spCoinContractDeployed.getAccountList();
    context.spCoinLogger.logExitFunction();
    return insertedAccountList;
}
