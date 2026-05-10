// @ts-nocheck
import { buildHandler } from '../../readMethodRuntime';
const handler = buildHandler('getPendingRewards', async (context) => context.read.getPendingRewards(String(context.methodArgs[0])));
export default handler;
