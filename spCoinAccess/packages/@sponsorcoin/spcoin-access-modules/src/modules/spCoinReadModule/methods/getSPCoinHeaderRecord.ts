// @ts-nocheck
export async function getSPCoinHeaderRecord(context, getBody) {
    const runtime = context;
    runtime.spCoinLogger.logFunctionHeader("getOffLineAccountRecords()");
    const sponsorCoinHeader = await runtime.spCoinSerialize.getSPCoinHeaderObject();
    sponsorCoinHeader.location = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (getBody) {
        const accountRecords = await runtime.getOffLineAccountRecords();
        sponsorCoinHeader.accountRecords = Array.isArray(accountRecords) ? accountRecords : [];
    }
    return sponsorCoinHeader;
}

