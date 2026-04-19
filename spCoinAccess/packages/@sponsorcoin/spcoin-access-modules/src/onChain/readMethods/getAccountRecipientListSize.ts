// @ts-nocheck
import { buildHandler } from '../../readMethodRuntime';
const handler = buildHandler('getRecipientKeyCount', async (context) => {
    const method =
        typeof context.read.getRecipientKeys === 'function'
            ? context.read.getRecipientKeys
            : context.read.getAccountRecipientList;
    const recipientList = context.normalizeStringListResult(await method(String(context.methodArgs[0])));
    return recipientList.length;
});
export default handler;

