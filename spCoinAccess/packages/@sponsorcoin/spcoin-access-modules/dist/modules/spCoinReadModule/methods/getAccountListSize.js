// @ts-nocheck
export async function getAccountListSize(context) {
    const runtime = context;
    runtime.spCoinLogger.logFunctionHeader("getMasterAccountKeyCount = async()");
    if (typeof runtime.spCoinContractDeployed?.getMasterAccountKeyCount === "function") {
        const count = Number(await runtime.spCoinContractDeployed.getMasterAccountKeyCount());
        runtime.spCoinLogger.logDetail("JS => Found " + count + " Account Keys");
        runtime.spCoinLogger.logExitFunction();
        return count;
    }
    if (typeof runtime.spCoinContractDeployed?.getAccountKeyCount === "function") {
        const count = Number(await runtime.spCoinContractDeployed.getAccountKeyCount());
        runtime.spCoinLogger.logDetail("JS => Found " + count + " Account Keys");
        runtime.spCoinLogger.logExitFunction();
        return count;
    }
    const loadAccountKeys =
        typeof runtime.getMasterAccountKeys === "function"
            ? runtime.getMasterAccountKeys.bind(runtime)
            : typeof runtime.getAccountKeys === "function"
                ? runtime.getAccountKeys.bind(runtime)
                : typeof runtime.getMasterAccountList === "function"
                    ? runtime.getMasterAccountList.bind(runtime)
                    : typeof runtime.getAccountList === "function"
                        ? runtime.getAccountList.bind(runtime)
                        : null;
    if (!loadAccountKeys) {
        throw new Error("getMasterAccountKeyCount requires getMasterAccountKeys() on the current read runtime.");
    }
    const maxSize = (await loadAccountKeys()).length;
    runtime.spCoinLogger.logDetail("JS => Found " + maxSize + " Account Keys");
    runtime.spCoinLogger.logExitFunction();
    return maxSize;
}
export const getAccountKeyCount = getAccountListSize;
export const getMasterAccountKeyCount = getAccountListSize;
export const getMasterAccountCount = getAccountListSize;
export const getMasterAccountListSize = getAccountListSize;
