// @ts-nocheck
import { buildHandler } from '../../readMethodRuntime';
const handler = buildHandler('getRecipientTransactionList', async (context) => {
    const rates = (await context.contract.getRecipientRateList?.(context.methodArgs[0], context.methodArgs[1])) ?? [];
    return Promise.all(rates.map(async (rate) => ({
        recipientRateKey: String(rate),
        serializedRecipientTransaction: await context.requireExternalSerializedValue('getSerializedRecipientRateList', [
            context.methodArgs[0],
            context.methodArgs[1],
            String(rate),
        ]),
    })));
});
export default handler;
