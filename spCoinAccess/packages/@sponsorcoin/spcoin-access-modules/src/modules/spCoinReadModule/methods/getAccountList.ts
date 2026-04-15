// @ts-nocheck
export async function getAccountList(context) {
    context.spCoinLogger.logFunctionHeader("getAccountList = async()");
    const insertedAccountList =
        typeof context.spCoinContractDeployed.getMasterAccountList === "function"
            ? await context.spCoinContractDeployed.getMasterAccountList()
            : await context.spCoinContractDeployed.getAccountList();
    context.spCoinLogger.logExitFunction();
    return insertedAccountList;
}

