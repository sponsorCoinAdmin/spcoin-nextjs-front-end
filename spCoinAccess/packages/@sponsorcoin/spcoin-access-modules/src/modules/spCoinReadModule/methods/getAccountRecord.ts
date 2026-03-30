// @ts-nocheck
export async function getAccountRecord(context, _accountKey) {
    const runtime = context;
    const accountStruct = await runtime.spCoinSerialize.getAccountRecordObject(_accountKey);
    accountStruct.accountKey = _accountKey;
    const recipientAccountList = await runtime.getAccountRecipientList(_accountKey);
    accountStruct.recipientRecordList = await runtime.getRecipientRecordList(_accountKey, recipientAccountList);
    accountStruct.stakingRewardList = await runtime.getAccountStakingRewards(_accountKey);
    runtime.spCoinLogger.logExitFunction();
    return accountStruct;
}

