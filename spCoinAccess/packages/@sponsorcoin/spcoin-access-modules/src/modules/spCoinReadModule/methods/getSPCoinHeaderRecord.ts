// @ts-nocheck
export async function getSPCoinHeaderRecord(context, getBody) {
    const runtime = context;
    runtime.spCoinLogger.logFunctionHeader("getSPCoinHeaderRecord()");
    const sponsorCoinHeader = await runtime.spCoinSerialize.getSPCoinHeaderObject();
    sponsorCoinHeader.location = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (getBody) {
        const accountList = await runtime.getMasterAccountList();
        const accountRecords = await Promise.all(accountList.map((accountKey) => runtime.getAccountRecord(accountKey)));
        sponsorCoinHeader.accountRecords = Array.isArray(accountRecords) ? accountRecords : [];
    }
    return sponsorCoinHeader;
}

