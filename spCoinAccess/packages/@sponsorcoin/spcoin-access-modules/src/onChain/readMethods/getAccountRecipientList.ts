// @ts-nocheck
import { buildHandler } from '../../readMethodRuntime';

const handler = buildHandler('getAccountRecipientList', async (context) => {
    return context.normalizeStringListResult(
        await context.read.getAccountRecipientList(String(context.methodArgs[0]))
    );
});

export default handler;
