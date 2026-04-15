// @ts-nocheck
import { buildHandler, runDynamicMethod } from '../../readMethodRuntime';
const handler = buildHandler('calculateStakingRewards', async (context) => {
    const [stakedSPCoins, lastUpdateTime, transactionTimeStamp, rate] = context.methodArgs;
    return runDynamicMethod({
        ...context,
        methodArgs: [stakedSPCoins, transactionTimeStamp, lastUpdateTime, rate],
    }, 'calculateStakingRewards');
});
export default handler;
