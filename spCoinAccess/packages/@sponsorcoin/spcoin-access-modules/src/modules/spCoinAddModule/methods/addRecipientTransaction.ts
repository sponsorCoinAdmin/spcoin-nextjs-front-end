// @ts-nocheck
import { normalizeRawQuantityUnits } from "../shared";

export const addRecipientTransaction = async (context, _sponsorKey, _recipientKey, _recipientRateKey, _transactionQty) => {
    context.spCoinLogger.logFunctionHeader(
        "addRecipientTransaction = async(" + _sponsorKey + ", " + _recipientKey + ", " + _recipientRateKey + ", " + _transactionQty + ")"
    );
    const amount = await normalizeRawQuantityUnits(context, _transactionQty);
    const contractMethod = context.spCoinContractDeployed.addRecipientTransaction
        ?? context.spCoinContractDeployed.addRecipientTransaction;
    const tx = await contractMethod(
        _sponsorKey,
        _recipientKey,
        _recipientRateKey,
        amount
    );
    context.spCoinLogger.logExitFunction();
    return tx;
};
