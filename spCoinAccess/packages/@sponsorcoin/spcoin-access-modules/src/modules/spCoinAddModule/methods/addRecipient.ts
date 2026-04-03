// @ts-nocheck
export const addRecipient = async (context, _recipientKey) => {
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const toAddressList = (value) =>
        Array.isArray(value) ? value.map((entry) => String(entry || "").toLowerCase()) : [];
    const waitForVisibility = async (label, loadValue, isVisible, attempts = 40, delayMs = 500) => {
        let lastValue;
        for (let attempt = 1; attempt <= attempts; attempt++) {
            lastValue = await loadValue();
            const visible = isVisible(lastValue);
            context.spCoinLogger.logDetail(
                "JS => " + label + " visibility check #" + String(attempt) + " = " + JSON.stringify(lastValue)
            );
            if (visible) {
                return lastValue;
            }
            await sleep(delayMs);
        }
        throw new Error(label + " did not become visible on the RPC after the transaction receipt confirmed.");
    };

    context.spCoinLogger.logFunctionHeader("addRecipient = async(" + _recipientKey + ")");
    context.spCoinLogger.logDetail("JS => Inserting " + _recipientKey + " Recipient To Blockchain Network");
    context.spCoinLogger.logDetail("JS => Inserting Recipient " + _recipientKey);
    const tx = await context.spCoinContractDeployed.addRecipient(_recipientKey);
    const receipt = await tx.wait();
    context.spCoinLogger.logDetail(
        "JS => addRecipient receipt status = " + String(receipt?.status ?? "") + " hash = " + String(receipt?.hash || tx?.hash || "")
    );
    if (Number(receipt?.status ?? 0) !== 1) {
        throw new Error("addRecipient reverted on-chain with receipt status " + String(receipt?.status ?? "unknown"));
    }

    await sleep(1000);

    let recipientInsertedVisible = false;
    if (typeof context.spCoinContractDeployed.isAccountInserted === "function") {
        try {
            await waitForVisibility(
                "addRecipient recipient account inserted",
                () => context.spCoinContractDeployed.isAccountInserted(_recipientKey),
                (value) => value === true
            );
            recipientInsertedVisible = true;
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            context.spCoinLogger.logDetail("JS => addRecipient recipient inserted visibility fallback: " + message);
        }
    }

    const sponsorKey =
        typeof context.spCoinContractDeployed?.runner?.getAddress === "function"
            ? await context.spCoinContractDeployed.runner.getAddress()
            : "";

    let sponsorRecipientListVisible = false;
    if (sponsorKey && typeof context.spCoinContractDeployed.getAccountRecipientList === "function") {
        try {
            await waitForVisibility(
                "addRecipient sponsor recipient list",
                () => context.spCoinContractDeployed.getAccountRecipientList(sponsorKey),
                (value) => toAddressList(value).includes(String(_recipientKey || "").toLowerCase())
            );
            sponsorRecipientListVisible = true;
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            context.spCoinLogger.logDetail("JS => addRecipient sponsor recipient visibility fallback: " + message);
        }
    }

    if (!recipientInsertedVisible && !sponsorRecipientListVisible) {
        throw new Error(
            "addRecipient receipt was mined but neither isAccountInserted(recipient) nor getAccountRecipientList(sponsor) reflected the recipient after visibility polling."
        );
    }

    context.spCoinLogger.logExitFunction();
    return tx;
};

