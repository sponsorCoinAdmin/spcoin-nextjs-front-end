// @ts-nocheck
export const addBackDatedAgentTransaction = async (context, _adminSigner, _sponsorKey, _recipientKey, _recipientRateKey, _accountAgentKey, _agentRateKey, _transactionQty, _transactionBackDate) => {
    context.spCoinLogger.logFunctionHeader("addBackDatedAgentTransaction = async(" +
        _adminSigner + ", " +
        _sponsorKey + ", " +
        _recipientKey + ", " +
        _recipientRateKey + ", " +
        _accountAgentKey + ", " +
        _agentRateKey + ", " +
        _transactionQty + ", " +
        _transactionBackDate + ")");
    _transactionBackDate = Math.trunc(_transactionBackDate);
    const ownerAddress = await context.spCoinContractDeployed.owner();
    const signerAddress = typeof _adminSigner?.getAddress === "function"
        ? await _adminSigner.getAddress()
        : _adminSigner?.address;
    if (!signerAddress || String(signerAddress).toLowerCase() !== String(ownerAddress).toLowerCase()) {
        throw new Error("backdated sponsorship methods require the owner signer.");
    }
    const transactionIndex = await context.spCoinContractDeployed.getAgentTransactionCount(
        _sponsorKey,
        _recipientKey,
        _recipientRateKey,
        _accountAgentKey,
        _agentRateKey
    );
    const addTx = await context.addAgentTransaction(
        _sponsorKey,
        _recipientKey,
        _recipientRateKey,
        _accountAgentKey,
        _agentRateKey,
        _transactionQty
    );
    if (addTx && typeof addTx.wait === "function") {
        await addTx.wait();
    }
    const tx = await context.backDateAgentTransactionDate(
        _adminSigner,
        _sponsorKey,
        _recipientKey,
        _recipientRateKey,
        _accountAgentKey,
        _agentRateKey,
        transactionIndex,
        _transactionBackDate
    );
    context.spCoinLogger.logExitFunction();
    return tx;
};
