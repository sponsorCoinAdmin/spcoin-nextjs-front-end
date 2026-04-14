// @ts-nocheck
export const addBackDatedRecipientRateTransaction = async (
    context,
    _adminSigner,
    _sponsorKey,
    _recipientKey,
    _recipientRateKey,
    _transactionQty,
    _transactionBackDate
) => {
    context.spCoinLogger.logFunctionHeader("addBackDatedRecipientRateTransaction = async(" +
        _adminSigner + ", " +
        _sponsorKey + ", " +
        _recipientKey + ", " +
        _recipientRateKey + ", " +
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
    const transactionIndex = await context.spCoinContractDeployed.getRecipientRateTransactionCount(
        _sponsorKey,
        _recipientKey,
        _recipientRateKey
    );
    const addTx = await context.addRecipientRateTransaction(_sponsorKey, _recipientKey, _recipientRateKey, _transactionQty);
    if (addTx && typeof addTx.wait === "function") {
        await addTx.wait();
    }
    const tx = await context.backDateRecipientTransactionDate(
        _adminSigner,
        _sponsorKey,
        _recipientKey,
        _recipientRateKey,
        transactionIndex,
        _transactionBackDate
    );
    context.spCoinLogger.logExitFunction();
    return tx;
};
