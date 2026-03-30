// @ts-nocheck
export function getAccountRewardTransactionList(context, _rewardAccountList) {
    const runtime = context;
    const rewardTransactionsByAccountList = [];
    for (let idx = _rewardAccountList.length - 1; idx >= 1; idx--) {
        const rewardAccountRecord = runtime.getAccountRewardTransactionRecord(_rewardAccountList[idx]);
        rewardTransactionsByAccountList.push(rewardAccountRecord);
    }
    runtime.spCoinLogger.logExitFunction();
    return rewardTransactionsByAccountList;
}
