// @ts-nocheck
import { createDynamicHandler, getDynamicMethod } from '../../readMethodRuntime';
const handler = createDynamicHandler('getSpCoinMetaData', async (result, context) => {
    if (!result || typeof result !== 'object' || Array.isArray(result)) {
        return result;
    }
    const metadata = result as Record<string, unknown>;
    let creationDate = '';
    try {
        const creationTimeMethod = getDynamicMethod(context.contract, 'creationTime');
        if (creationTimeMethod) {
            creationDate = context.formatCreationTimeResult(await creationTimeMethod()).formatted;
        }
    }
    catch {
        creationDate = '';
    }
    const resolvedCreationDate = creationDate || String(metadata.creationDate ?? '');
    return {
        contractAddress: context.target,
        owner: String(metadata.owner ?? ''),
        creationDate: resolvedCreationDate,
        version: String(metadata.version ?? ''),
        name: String(metadata.name ?? ''),
        symbol: String(metadata.symbol ?? ''),
        decimals: metadata.decimals,
        totalSupply: metadata.totalSupply,
        inflationRate: metadata.inflationRate,
        recipientRateRange: metadata.recipientRateRange,
        agentRateRange: metadata.agentRateRange,
    };
});
export default handler;

