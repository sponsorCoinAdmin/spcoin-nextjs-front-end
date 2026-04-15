// @ts-nocheck
export async function getMasterAccountList(context) {
    context.spCoinLogger.logFunctionHeader("getMasterAccountList = async()");
    const insertedAccountList = await context.spCoinContractDeployed.getMasterAccountList();
    context.spCoinLogger.logExitFunction();
    return insertedAccountList;
}

