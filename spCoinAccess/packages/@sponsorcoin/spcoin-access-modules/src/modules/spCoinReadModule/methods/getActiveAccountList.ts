// @ts-nocheck
import { getAccountKeys } from "./getMasterAccountList";

export async function getActiveAccountKeys(context) {
    context.spCoinLogger.logFunctionHeader("getActiveAccountKeys = async()");
    if (typeof context.spCoinContractDeployed.getActiveAccountKeys === "function") {
        const activeAccountList = await context.spCoinContractDeployed.getActiveAccountKeys();
        context.spCoinLogger.logExitFunction();
        return activeAccountList;
    }
    if (typeof context.spCoinContractDeployed.isActiveAccount !== "function") {
        throw new Error("getActiveAccountKeys requires getMasterAccountKeys() and isActiveAccount().");
    }
    const masterAccountList = await getAccountKeys(context);
    const activeAccountList = [];
    for (const accountKey of masterAccountList) {
        if (await context.spCoinContractDeployed.isActiveAccount(accountKey)) {
            activeAccountList.push(accountKey);
        }
    }
    context.spCoinLogger.logExitFunction();
    return activeAccountList;
}

export const getActiveAccountList = getActiveAccountKeys;
