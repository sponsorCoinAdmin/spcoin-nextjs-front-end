import { buildHandler } from '../../readMethodRuntime';
const handler = buildHandler('getRecipientRecord', async (context) => context.read.getRecipientRecord(String(context.methodArgs[0]), String(context.methodArgs[1])));
export default handler;
