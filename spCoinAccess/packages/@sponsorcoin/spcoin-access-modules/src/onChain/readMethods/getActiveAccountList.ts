// @ts-nocheck
import { buildHandler, getDynamicMethod } from '../../readMethodRuntime';

export default buildHandler('getActiveAccountKeys', async (context) => {
    const directMethod = getDynamicMethod(context.contract, 'getActiveAccountKeys')
        || getDynamicMethod(context.read, 'getActiveAccountKeys');
    if (directMethod) {
        return directMethod();
    }

    const masterMethod = getDynamicMethod(context.read, 'getMasterAccountKeys')
        || getDynamicMethod(context.read, 'getAccountKeys')
        || getDynamicMethod(context.contract, 'getMasterAccountKeys');
    const activeMethod = getDynamicMethod(context.contract, 'isAccountActive');
    if (!masterMethod || !activeMethod) {
        throw new Error('getActiveAccountKeys requires getMasterAccountKeys() and isAccountActive().');
    }

    const masterAccountList = await masterMethod();
    const activeAccountList = [];
    for (const accountKey of masterAccountList) {
        if (await activeMethod(accountKey)) {
            activeAccountList.push(accountKey);
        }
    }
    return activeAccountList;
});
