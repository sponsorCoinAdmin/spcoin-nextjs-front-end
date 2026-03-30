// @ts-nocheck
import { buildHandler } from '../../readMethodRuntime';
const handler = buildHandler('getSPCoinHeaderRecord', async (context) => context.read.getSPCoinHeaderRecord(Boolean(context.methodArgs[0])));
export default handler;
