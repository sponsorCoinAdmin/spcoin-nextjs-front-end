// @ts-nocheck
export async function getAccountListSize(context) {
    const runtime = context;
    runtime.spCoinLogger.logFunctionHeader("getAccountListSize = async()");
    const loadAccountKeys =
        typeof runtime.getAccountKeys === "function"
            ? runtime.getAccountKeys.bind(runtime)
            : typeof runtime.getMasterAccountKeys === "function"
                ? runtime.getMasterAccountKeys.bind(runtime)
                : typeof runtime.getMasterAccountList === "function"
                    ? runtime.getMasterAccountList.bind(runtime)
                    : null;
    if (!loadAccountKeys) {
        throw new Error("getAccountListSize requires getAccountKeys() on the current read runtime.");
    }
    const maxSize = (await loadAccountKeys()).length;
    runtime.spCoinLogger.logDetail("JS => Found " + maxSize + " Account Keys");
    runtime.spCoinLogger.logExitFunction();
    return maxSize;
}

export const getAccountKeyCount = getAccountListSize;
export const getMasterAccountListSize = getAccountListSize;

