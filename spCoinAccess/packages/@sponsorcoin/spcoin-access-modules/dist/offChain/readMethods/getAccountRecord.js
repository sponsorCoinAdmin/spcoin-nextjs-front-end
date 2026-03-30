import { buildHandler } from '../../readMethodRuntime';
const handler = buildHandler('getAccountRecord', async (context) => context.read.getAccountRecord(String(context.methodArgs[0])));
export default handler;
