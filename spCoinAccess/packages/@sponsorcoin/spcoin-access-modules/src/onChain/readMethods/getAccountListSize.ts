// @ts-nocheck
import { buildHandler } from '../../readMethodRuntime';
const handler = buildHandler('getAccountListSize', async (context) => {
    const accountList = context.normalizeStringListResult(await context.read.getAccountList());
    return accountList.length;
});
export default handler;

