// @ts-nocheck
import { buildHandler } from '../../readMethodRuntime';
const handler = buildHandler('getAgentRateRecord', async (context) => context.read.getAgentRateRecord(String(context.methodArgs[0]), String(context.methodArgs[1]), context.toStringOrNumber(context.methodArgs[2]), String(context.methodArgs[3]), context.toStringOrNumber(context.methodArgs[4])));
export default handler;
