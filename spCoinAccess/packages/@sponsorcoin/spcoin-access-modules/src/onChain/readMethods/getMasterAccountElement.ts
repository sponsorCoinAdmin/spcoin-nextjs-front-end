// @ts-nocheck
import { buildHandler, getDynamicMethod } from '../../readMethodRuntime';

const handler = buildHandler('getMasterAccountElement', async (context) => {
  const directMethod =
    getDynamicMethod(context.read, 'getMasterAccountElement') ??
    getDynamicMethod(context.staking, 'getMasterAccountElement') ??
    getDynamicMethod(context.contract, 'getMasterAccountElement');

  if (directMethod) {
    return directMethod(...context.methodArgs);
  }

  const listMethod =
    getDynamicMethod(context.read, 'getMasterAccountList') ??
    getDynamicMethod(context.staking, 'getMasterAccountList') ??
    getDynamicMethod(context.contract, 'getMasterAccountList');

  if (!listMethod) {
    throw new Error(`SpCoin read method ${context.selectedMethod} is not available on access modules or contract.`);
  }

  const index = Number(String(context.methodArgs[0] ?? '').replace(/,/g, '').trim());
  if (!Number.isInteger(index) || index < 0) {
    throw new Error('Index must be a non-negative integer.');
  }

  const accountList = context.normalizeStringListResult
    ? context.normalizeStringListResult(await listMethod())
    : await listMethod();
  const account = Array.isArray(accountList) ? accountList[index] : undefined;
  if (typeof account === 'undefined') {
    throw new Error(`Index ${index} is outside the master account list.`);
  }

  return account;
});

export default handler;
