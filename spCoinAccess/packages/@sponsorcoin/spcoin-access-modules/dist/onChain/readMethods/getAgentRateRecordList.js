// @ts-nocheck
import { buildHandler } from '../../readMethodRuntime';
const handler = buildHandler('getAgentRateRecordList', async (context) => {
    const agentRateKeys = (await context.contract.getAgentRateList?.(context.methodArgs[0], context.methodArgs[1], context.methodArgs[2], context.methodArgs[3]));
    return Promise.all((agentRateKeys ?? []).map(async (agentRateKey) => ({
        agentRateKey: String(agentRateKey),
        serializedAgentRateRecord: await context.requireExternalSerializedValue('serializeAgentRateRecordStr', [
            context.methodArgs[0],
            context.methodArgs[1],
            context.methodArgs[2],
            context.methodArgs[3],
            String(agentRateKey),
        ]),
    })));
});
export default handler;
