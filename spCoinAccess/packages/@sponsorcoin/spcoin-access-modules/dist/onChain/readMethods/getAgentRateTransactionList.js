// @ts-nocheck
import { bigIntToDateTimeString, bigIntToDecString } from '../../utils/dateTime';
import { buildHandler } from '../../readMethodRuntime';
const handler = buildHandler('getAgentTransactionList', async (context) => {
    const agentRateKeys = (await context.contract.getAgentRateList?.(context.methodArgs[0], context.methodArgs[1], context.methodArgs[2], context.methodArgs[3]));
    return Promise.all((agentRateKeys ?? []).map(async (agentRateKey) => {
        const serializedAgentTransaction = await context.requireExternalSerializedValue('serializedAgentTransactionStr', [
            context.methodArgs[0],
            context.methodArgs[1],
            context.methodArgs[2],
            context.methodArgs[3],
            String(agentRateKey),
        ]);
        const recordFields = String(serializedAgentTransaction || '').split(',');
        return {
            agentRateKey: String(agentRateKey),
            serializedAgentTransaction: {
                serializedAgentTransaction,
                creationTime: bigIntToDateTimeString(recordFields[0] || '0'),
                lastUpdateTime: bigIntToDateTimeString(recordFields[1] || '0'),
                stakedSPCoins: bigIntToDecString(recordFields[2] || '0'),
            },
        };
    }));
});
export default handler;
