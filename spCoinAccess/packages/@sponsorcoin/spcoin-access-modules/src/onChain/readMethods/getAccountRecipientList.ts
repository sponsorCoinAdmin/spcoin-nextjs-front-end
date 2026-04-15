// @ts-nocheck
import { buildHandler, getDynamicMethod } from '../../readMethodRuntime';

const handler = buildHandler('getAccountRecipientList', async (context) => {
    const accountKey = String(context.methodArgs[0]);
    const isAccountInserted =
        getDynamicMethod(context.read, 'isAccountInserted') ??
        getDynamicMethod(context.staking, 'isAccountInserted') ??
        getDynamicMethod(context.contract, 'isAccountInserted');

    if (isAccountInserted) {
        const exists = await isAccountInserted(accountKey);
        if (exists !== true && String(exists).toLowerCase() !== 'true') {
            throw new Error(`Account not found: ${accountKey}`);
        }
    } else {
        const getMasterAccountList =
            getDynamicMethod(context.read, 'getMasterAccountList') ??
            getDynamicMethod(context.staking, 'getMasterAccountList') ??
            getDynamicMethod(context.contract, 'getMasterAccountList');
        if (getMasterAccountList) {
            const accountList = context.normalizeStringListResult(await getMasterAccountList());
            const normalizedAccountKey = accountKey.trim().toLowerCase();
            const exists = accountList.some((address) => String(address).trim().toLowerCase() === normalizedAccountKey);
            if (!exists) {
                throw new Error(`Account not found: ${accountKey}`);
            }
        }
    }

    return context.normalizeStringListResult(
        await context.read.getAccountRecipientList(accountKey)
    );
});

export default handler;
