// @ts-nocheck
import { buildHandler } from '../../readMethodRuntime';
const handler = buildHandler('getMasterAccountCount', async (context) => {
    const readHost = (context && typeof context === 'object' && context.read && typeof context.read === 'object')
        ? context.read
        : {};
    const method =
        typeof readHost.getMasterAccountKeys === 'function'
            ? readHost.getMasterAccountKeys
            : typeof readHost.getAccountKeys === 'function'
                ? readHost.getAccountKeys
                : typeof readHost.getMasterAccountList === 'function'
                    ? readHost.getMasterAccountList
                    : null;
    if (!method) {
        throw new Error('getMasterAccountCount requires getMasterAccountKeys() on the current read runtime.');
    }
    const rawResult = await method();
    const accountList = typeof context.normalizeStringListResult === 'function'
        ? context.normalizeStringListResult(rawResult)
        : Array.isArray(rawResult)
            ? rawResult.map((entry) => String(entry))
            : [];
    return Array.isArray(accountList) ? accountList.length : 0;
});
export default handler;

