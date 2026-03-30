// @ts-nocheck
import { buildHandler } from '../../readMethodRuntime';
const handler = buildHandler('getRecipientRateRecord', async (context) => context.read.getRecipientRateRecord(String(context.methodArgs[0]), String(context.methodArgs[1]), context.toStringOrNumber(context.methodArgs[2])));
export default handler;
