// @ts-nocheck
import { normalizeRawQuantityUnits } from "../shared";

export const addAgentTransaction = async (
    context,
    _sponsorKey,
    _recipientKey,
    _recipientRateKey,
    _accountAgentKey,
    _agentRateKey,
    _transactionQty
) => {
    context.spCoinLogger.logFunctionHeader(
        "addAgentTransaction = async(" +
            _sponsorKey + ", " +
            _recipientKey + ", " +
            _recipientRateKey + ", " +
            _accountAgentKey + ", " +
            _agentRateKey + ", " +
            _transactionQty + ")"
    );
    const amount = await normalizeRawQuantityUnits(context, _transactionQty);
    const contractMethod = context.spCoinContractDeployed.addAgentTransaction
        ?? context.spCoinContractDeployed.addAgentTransaction;
    const tx = await contractMethod(
        _sponsorKey,
        _recipientKey,
        _recipientRateKey,
        _accountAgentKey,
        _agentRateKey,
        amount
    );
    context.spCoinLogger.logExitFunction();
    return tx;
};
