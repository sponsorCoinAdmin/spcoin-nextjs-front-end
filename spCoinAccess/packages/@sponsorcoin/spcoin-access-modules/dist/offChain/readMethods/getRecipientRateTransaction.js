// @ts-nocheck
import { buildHandler } from '../../readMethodRuntime';
const handler = buildHandler('getRecipientRateTransaction', async (context) => context.read.getRecipientRateTransaction(String(context.methodArgs[0]), String(context.methodArgs[1]), context.toStringOrNumber(context.methodArgs[2])));
export default handler;
