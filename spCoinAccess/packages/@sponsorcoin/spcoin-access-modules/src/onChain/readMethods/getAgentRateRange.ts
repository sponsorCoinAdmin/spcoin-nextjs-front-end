// @ts-nocheck
import { buildHandler, getDynamicMethod } from '../../readMethodRuntime';

async function readRateRange(context, rangeMethod, lowerMethod, upperMethod) {
    const rangeFn = getDynamicMethod(context.read, rangeMethod)
        || getDynamicMethod(context.staking, rangeMethod)
        || getDynamicMethod(context.contract, rangeMethod);
    if (rangeFn) {
        return rangeFn();
    }

    const lowerFn = getDynamicMethod(context.read, lowerMethod)
        || getDynamicMethod(context.staking, lowerMethod)
        || getDynamicMethod(context.contract, lowerMethod);
    const upperFn = getDynamicMethod(context.read, upperMethod)
        || getDynamicMethod(context.staking, upperMethod)
        || getDynamicMethod(context.contract, upperMethod);
    if (!lowerFn || !upperFn) {
        throw new Error(`SpCoin read method ${context.selectedMethod} is not available on access modules or contract.`);
    }

    const [lower, upper] = await Promise.all([lowerFn(), upperFn()]);
    return [lower, upper];
}

const handler = buildHandler('getAgentRateRange', (context) =>
    readRateRange(context, 'getAgentRateRange', 'getLowerAgentRate', 'getUpperAgentRate'),
);
export default handler;

