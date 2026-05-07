// @ts-nocheck
import { buildHandler } from '../../readMethodRuntime';
const handler = buildHandler('getPendingAccountStakingRewards', async (context) => context.read.getPendingAccountStakingRewards(String(context.methodArgs[0])));
export default handler;
