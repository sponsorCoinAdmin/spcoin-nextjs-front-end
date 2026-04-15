// @ts-nocheck
import { Interface } from 'ethers';
import { buildHandler, getDynamicMethod } from '../../readMethodRuntime';

const legacyAccountListInterface = new Interface([
    'function getAccountList() view returns (address[])',
]);

async function callLegacyGetAccountList(contract) {
    const target = String(contract?.target || (typeof contract?.getAddress === 'function' ? await contract.getAddress() : ''));
    const runner = contract?.runner;
    if (!target || !runner || typeof runner.call !== 'function') {
        throw new Error('SpCoin read method getMasterAccountList is not available on access modules or contract.');
    }
    const data = legacyAccountListInterface.encodeFunctionData('getAccountList', []);
    const raw = await runner.call({ to: target, data });
    const decoded = legacyAccountListInterface.decodeFunctionResult('getAccountList', raw);
    return decoded[0];
}

const handler = buildHandler('getMasterAccountList', async (context) => {
    const method = getDynamicMethod(context.read, 'getMasterAccountList')
        || getDynamicMethod(context.staking, 'getMasterAccountList')
        || getDynamicMethod(context.contract, 'getMasterAccountList')
        || getDynamicMethod(context.read, 'getAccountList')
        || getDynamicMethod(context.staking, 'getAccountList')
        || getDynamicMethod(context.contract, 'getAccountList');
    if (!method) {
        return callLegacyGetAccountList(context.contract);
    }

    try {
        return await method();
    } catch (error) {
        const code = String(error?.code || '');
        const data = String(error?.data || '');
        const message = String(error?.message || '');
        if (code === 'CALL_EXCEPTION' || data === '0x' || /execution reverted|require\(false\)/i.test(message)) {
            return callLegacyGetAccountList(context.contract);
        }
        throw error;
    }
});

export default handler;
