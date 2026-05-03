// @ts-nocheck
import { buildHandler, getDynamicMethod } from '../../readMethodRuntime';

async function getMasterAccountKeys(context) {
  const method =
    getDynamicMethod(context.read, 'getMasterAccountKeys')
    || getDynamicMethod(context.staking, 'getMasterAccountKeys')
    || getDynamicMethod(context.contract, 'getMasterAccountKeys')
    || getDynamicMethod(context.read, 'getAccountKeys')
    || getDynamicMethod(context.staking, 'getAccountKeys')
    || getDynamicMethod(context.contract, 'getAccountKeys')
    || getDynamicMethod(context.read, 'getMasterAccountList')
    || getDynamicMethod(context.staking, 'getMasterAccountList')
    || getDynamicMethod(context.contract, 'getMasterAccountList')
    || getDynamicMethod(context.read, 'getAccountList')
    || getDynamicMethod(context.staking, 'getAccountList')
    || getDynamicMethod(context.contract, 'getAccountList');
  if (!method) {
    throw new Error('SpCoin read method getSponsorKeys requires a master account key list source.');
  }

  const result = await method();
  if (result?.accountKeys) return result.accountKeys;
  if (Array.isArray(result) && result.length === 2 && Array.isArray(result[1])) return result[1];
  return result;
}

async function isSponsorKey(context, accountKey) {
  const method =
    getDynamicMethod(context.read, 'isSponsor')
    || getDynamicMethod(context.contract, 'isSponsor');
  if (method) return Boolean(await method(accountKey));

  const rolesMethod = getDynamicMethod(context.read, 'getAccountRoles');
  if (rolesMethod) {
    const roles = await rolesMethod(accountKey);
    return Array.isArray(roles) && roles.map((role) => String(role).toLowerCase()).includes('sponsor');
  }

  const recordMethod = getDynamicMethod(context.read, 'getAccountRecord');
  if (recordMethod) {
    const record = await recordMethod(accountKey);
    const recipientKeys = record?.recipientKeys ?? record?.recipientList ?? [];
    const agentKeys = record?.agentKeys ?? record?.agentList ?? [];
    return (Array.isArray(recipientKeys) && recipientKeys.length > 0)
      || (Array.isArray(agentKeys) && agentKeys.length > 0);
  }

  throw new Error('SpCoin read method getSponsorKeys requires isSponsor(), getAccountRoles(), or getAccountRecord().');
}

const handler = buildHandler('getSponsorKeys', async (context) => {
  const readMethod = getDynamicMethod(context.read, 'getSponsorKeys');
  if (readMethod) {
    return context.normalizeStringListResult(await readMethod());
  }

  const accountKeys = context.normalizeStringListResult(await getMasterAccountKeys(context));
  const checks = await Promise.all(
    accountKeys.map(async (accountKey) => ({
      accountKey,
      isSponsor: await isSponsorKey(context, accountKey),
    })),
  );
  return checks.filter((entry) => entry.isSponsor).map((entry) => entry.accountKey);
});

export default handler;
