// @ts-nocheck
import { RewardAccountStruct } from "../../../dataTypes/spCoinDataTypes";
import { bigIntToDecString } from "../../../utils/dateTime";
export function getAccountRewardTransactionRecord(context, _rewardRecordStr) {
    const runtime = context;
    const rateRewardList = _rewardRecordStr.split("\nRATE:");
    let rewardAccountRecord;
    if (rateRewardList.length > 0) {
        rewardAccountRecord = new RewardAccountStruct();
        const rewardRecordFields = (rateRewardList.shift() ?? "").split(",");
        if (rateRewardList.length > 0) {
            rewardAccountRecord.sourceKey = rewardRecordFields[0];
            rewardAccountRecord.stakingRewards = bigIntToDecString(rewardRecordFields[1]);
            rewardAccountRecord.rateList = runtime.getAccountRateTransactionList(rateRewardList);
        }
    }
    runtime.spCoinLogger.logExitFunction();
    return rewardAccountRecord;
}
