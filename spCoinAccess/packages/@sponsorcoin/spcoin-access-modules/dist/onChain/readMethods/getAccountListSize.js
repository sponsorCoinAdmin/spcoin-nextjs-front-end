// @ts-nocheck
import { buildHandler } from '../../readMethodRuntime';
const handler = buildHandler('getMasterAccountKeyCount', async (context) => {
    if (typeof context.contract?.getMasterAccountKeyCount === 'function') {
        return Number(await context.contract.getMasterAccountKeyCount());
    }
    if (typeof context.contract?.getAccountKeyCount === 'function') {
        return Number(await context.contract.getAccountKeyCount());
    }
    const accountList = context.normalizeStringListResult(await context.read.getMasterAccountKeys?.() ?? await context.read.getAccountList());
    return accountList.length;
});
export default handler;
