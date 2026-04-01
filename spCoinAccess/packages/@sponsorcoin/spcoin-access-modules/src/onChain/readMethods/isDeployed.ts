// @ts-nocheck
import { buildHandler } from '../../readMethodRuntime';

const handler = buildHandler('isDeployed', async (context) => {
    const targetAddress = String(context.methodArgs[0] ?? '');
    const provider =
        context.contract?.runner?.provider ??
        context.contract?.provider ??
        context.read?.runner?.provider ??
        context.read?.provider;

    if (!provider || typeof provider.getCode !== 'function') {
        throw new Error('SpCoin read method isDeployed requires a provider with getCode(address).');
    }

    const code = await provider.getCode(targetAddress);
    return typeof code === 'string' && code !== '0x';
});

export default handler;
