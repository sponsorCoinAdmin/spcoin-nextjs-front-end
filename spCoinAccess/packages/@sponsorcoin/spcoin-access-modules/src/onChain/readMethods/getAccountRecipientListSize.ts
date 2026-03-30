// @ts-nocheck
import { buildHandler } from '../../readMethodRuntime';
const handler = buildHandler('getAccountRecipientListSize', async (context) => {
    const recipientList = context.normalizeStringListResult(await context.read.getAccountRecipientList(String(context.methodArgs[0])));
    return recipientList.length;
});
export default handler;

