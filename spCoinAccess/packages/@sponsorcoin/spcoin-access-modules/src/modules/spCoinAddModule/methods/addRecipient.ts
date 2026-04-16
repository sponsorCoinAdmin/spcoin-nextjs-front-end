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

    const sponsorKey =
        typeof context.spCoinContractDeployed?.runner?.getAddress === "function"
            ? await context.spCoinContractDeployed.runner.getAddress()
            : "";

    context.spCoinLogger.logFunctionHeader("addSponsorRecipient = async(" + sponsorKey + ", " + _recipientKey + ")");
    context.spCoinLogger.logDetail("JS => Inserting " + _recipientKey + " Recipient To Blockchain Network");
    context.spCoinLogger.logDetail("JS => Inserting Recipient " + _recipientKey);
    const tx = await context.spCoinContractDeployed.addSponsorRecipient(sponsorKey, _recipientKey);
    const receipt = await tx.wait();
    context.spCoinLogger.logDetail(
        "JS => addRecipient receipt status = " + String(receipt?.status ?? "") + " hash = " + String(receipt?.hash || tx?.hash || "")
    );
    if (Number(receipt?.status ?? 0) !== 1) {
        throw new Error("addRecipient reverted on-chain with receipt status " + String(receipt?.status ?? "unknown"));
    }

    await sleep(1000);

    if (typeof context.spCoinContractDeployed.isAccountInserted === "function") {
        await waitForVisibility(
            "addRecipient recipient account inserted",
            () => context.spCoinContractDeployed.isAccountInserted(_recipientKey),
            (value) => value === true
        );
    }

    if (sponsorKey && typeof context.spCoinContractDeployed.getAccountRecipientList === "function") {
        await waitForVisibility(
            "addRecipient sponsor recipient list",
            () => context.spCoinContractDeployed.getAccountRecipientList(sponsorKey),
            (value) => toAddressList(value).includes(String(_recipientKey || "").toLowerCase())
        );
    }

    context.spCoinLogger.logExitFunction();
    return tx;
};

