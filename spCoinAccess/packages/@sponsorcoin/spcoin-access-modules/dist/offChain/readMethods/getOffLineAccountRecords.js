import { buildHandler } from '../../readMethodRuntime';
const handler = buildHandler('getOffLineAccountRecords', async (context) => {
    const accountKeys = context.normalizeStringListResult(await context.read.getAccountList());
    return Promise.all(accountKeys.map(async (accountKey) => context.read.getAccountRecord(String(accountKey))));
});
export default handler;
