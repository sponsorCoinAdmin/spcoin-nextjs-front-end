// @ts-nocheck
import { createDynamicHandler, getDynamicMethod } from '../../readMethodRuntime';
const handler = createDynamicHandler('getSpCoinMetaData', async (result, context) => {
    if (!result || typeof result !== 'object' || Array.isArray(result)) {
        return result;
    }
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
    return {
        contractAddress: context.target,
        ...result,
        creationDate,
    };
});
export default handler;
