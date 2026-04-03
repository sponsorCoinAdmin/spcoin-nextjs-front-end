// @ts-nocheck
export const addAgentSponsorship = async (
  context,
  _sponsorSigner,
  _recipientKey,
  _recipientRateKey,
  _accountAgentKey,
  _agentRateKey,
  _transactionQty
) => {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const toDebugJson = (value) =>
    JSON.stringify(
      value,
      (_key, innerValue) => (typeof innerValue === "bigint" ? innerValue.toString() : innerValue),
      2
    );
  const toAddressList = (value) =>
    Array.isArray(value) ? value.map((entry) => String(entry || "").toLowerCase()) : [];
  const waitForVisibility = async (label, loadValue, isVisible, attempts = 40, delayMs = 500) => {
    let lastValue;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      lastValue = await loadValue();
      const visible = isVisible(lastValue);
      context.spCoinLogger.logDetail(
        "JS => " + label + " visibility check #" + String(attempt) + " = " + toDebugJson(lastValue)
      );
      if (visible) {
        return lastValue;
      }
      await sleep(delayMs);
    }
    throw new Error(label + " did not become visible on the RPC after the transaction receipt confirmed.");
  };
  const sendTxWithDiagnostics = async (label, send) => {
    const contractRunner = context.spCoinContractDeployed?.runner;
    const provider = contractRunner?.provider;
    try {
      if (provider && typeof provider.getBlockNumber === "function") {
        const blockNumber = await provider.getBlockNumber();
        context.spCoinLogger.logDetail("JS => " + label + " preflight blockNumber = " + String(blockNumber));
      }
      if (contractRunner && typeof contractRunner.getNonce === "function") {
        const nonce = await contractRunner.getNonce("pending");
        context.spCoinLogger.logDetail("JS => " + label + " preflight nonce = " + String(nonce));
      }
      if (provider && typeof provider.getFeeData === "function") {
        const feeData = await provider.getFeeData();
        context.spCoinLogger.logDetail(
          "JS => " + label + " preflight feeData = " +
            JSON.stringify({
              gasPrice: feeData?.gasPrice?.toString?.() ?? String(feeData?.gasPrice ?? ""),
              maxFeePerGas: feeData?.maxFeePerGas?.toString?.() ?? String(feeData?.maxFeePerGas ?? ""),
              maxPriorityFeePerGas: feeData?.maxPriorityFeePerGas?.toString?.() ?? String(feeData?.maxPriorityFeePerGas ?? ""),
            })
        );
      }
    } catch (preflightError) {
      const message = preflightError instanceof Error ? preflightError.message : String(preflightError);
      context.spCoinLogger.logDetail("JS => " + label + " preflight failed: " + message);
    }
    try {
      return await send();
    } catch (error) {
      const detail =
        error && typeof error === "object"
          ? toDebugJson({
              message: error?.message,
              reason: error?.reason,
              code: error?.code,
              action: error?.action,
              shortMessage: error?.shortMessage,
              data: error?.data,
              info: error?.info,
              error: error?.error,
            })
          : String(error);
      context.spCoinLogger.logDetail("JS => " + label + " send failed detail = " + detail);
      throw error;
    }
  };
  const ensureSuccessfulReceipt = (label, receipt) => {
    const status = Number(receipt?.status ?? 0);
    context.spCoinLogger.logDetail(
      "JS => " + label + " receipt status = " + String(receipt?.status ?? "")
    );
    if (status !== 1) {
      throw new Error(label + " reverted on-chain with receipt status " + String(receipt?.status ?? "unknown"));
    }
  };

  context.spCoinLogger.logFunctionHeader(
    "addAgentSponsorship = async(" +
      _sponsorSigner + ", " +
      _recipientKey + ", " +
      _recipientRateKey + ", " +
      _accountAgentKey + ", " +
      _agentRateKey + ", " +
      _transactionQty + ")"
  );

  const components = _transactionQty.toString().split(".");
  const wholePart = components[0].length > 0 ? components[0] : "0";
  const fractionalPart = components.length > 1 ? components[1] : "0";
  const sponsorKey =
    typeof _sponsorSigner?.getAddress === "function"
      ? await _sponsorSigner.getAddress()
      : _sponsorSigner?.address;
  const transactionTimeStamp = Math.trunc(Date.now() / 1000);
  const logStructureSnapshot = async (stageLabel) => {
    const snapshot = {};
    if (typeof context.spCoinContractDeployed.getAccountList === "function") {
      snapshot.accountList = await context.spCoinContractDeployed.getAccountList();
    }
    if (typeof context.spCoinContractDeployed.isAccountInserted === "function") {
      snapshot.sponsorInserted = await context.spCoinContractDeployed.isAccountInserted(sponsorKey);
      snapshot.recipientInserted = await context.spCoinContractDeployed.isAccountInserted(_recipientKey);
      snapshot.agentInserted = await context.spCoinContractDeployed.isAccountInserted(_accountAgentKey);
    }
    if (typeof context.spCoinContractDeployed.getAccountRecipientList === "function") {
      snapshot.sponsorRecipientList = await context.spCoinContractDeployed.getAccountRecipientList(sponsorKey);
    }
    if (typeof context.spCoinContractDeployed.getRecipientRateList === "function") {
      snapshot.recipientRateList = await context.spCoinContractDeployed.getRecipientRateList(
        sponsorKey,
        _recipientKey
      );
    }
    if (typeof context.spCoinContractDeployed.getRecipientRateAgentList === "function") {
      snapshot.recipientRateAgentList = await context.spCoinContractDeployed.getRecipientRateAgentList(
        sponsorKey,
        _recipientKey,
        _recipientRateKey
      );
    }
    context.spCoinLogger.logDetail(
      "JS => addAgentSponsorship structure " + stageLabel + " = " + toDebugJson(snapshot)
    );
  };

  context.spCoinLogger.logDetail(
    "JS => addAgentSponsorship sponsor/recipient/rate/agent/agentRate/whole/fraction/timestamp = " +
      String(sponsorKey || "") + "/" +
      String(_recipientKey) + "/" +
      String(_recipientRateKey) + "/" +
      String(_accountAgentKey) + "/" +
      String(_agentRateKey) + "/" +
      String(wholePart) + "/" +
      String(fractionalPart) + "/" +
      String(transactionTimeStamp)
  );

    try {
      await logStructureSnapshot("before addRecipient");
      const addRecipientTx = await sendTxWithDiagnostics(
        "addRecipient",
        () => context.spCoinContractDeployed.addRecipient(_recipientKey)
    );
    context.spCoinLogger.logDetail("JS => addRecipient tx hash = " + String(addRecipientTx?.hash || ""));
    const addRecipientReceipt = await addRecipientTx.wait();
      ensureSuccessfulReceipt("addRecipient", addRecipientReceipt);
      context.spCoinLogger.logDetail("JS => addRecipient mined");
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
      let sponsorRecipientListVisible = false;
      if (typeof context.spCoinContractDeployed.getAccountRecipientList === "function") {
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
      await logStructureSnapshot("after addRecipient");
    } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    context.spCoinLogger.logDetail("JS => addRecipient failed: " + message);
    throw error;
  }

  try {
    await logStructureSnapshot("before addAgent");
    const addAgentTx = await sendTxWithDiagnostics(
      "addAgent",
      () => context.spCoinContractDeployed.addAgent(
        _recipientKey,
        _recipientRateKey,
        _accountAgentKey
      )
    );
    context.spCoinLogger.logDetail("JS => addAgent tx hash = " + String(addAgentTx?.hash || ""));
    const addAgentReceipt = await addAgentTx.wait();
    ensureSuccessfulReceipt("addAgent", addAgentReceipt);
    context.spCoinLogger.logDetail("JS => addAgent mined");
    if (typeof context.spCoinContractDeployed.getRecipientRateAgentList === "function") {
      await waitForVisibility(
        "addAgent recipient rate agent list",
        () =>
          context.spCoinContractDeployed.getRecipientRateAgentList(
            sponsorKey,
            _recipientKey,
            _recipientRateKey
          ),
        (value) => toAddressList(value).includes(String(_accountAgentKey || "").toLowerCase())
      );
    }
    await logStructureSnapshot("after addAgent");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    context.spCoinLogger.logDetail("JS => addAgent failed: " + message);
    throw error;
  }

  try {
    await logStructureSnapshot("pre-addBackDatedSponsorship");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    context.spCoinLogger.logDetail("JS => post-addAgent diagnostics failed: " + message);
  }

  try {
    const tx = await sendTxWithDiagnostics(
      "addBackDatedSponsorship",
      () => context.spCoinContractDeployed.addBackDatedSponsorship(
        sponsorKey,
        _recipientKey,
        _recipientRateKey,
        _accountAgentKey,
        _agentRateKey,
        wholePart,
        fractionalPart,
        transactionTimeStamp
      )
    );
    context.spCoinLogger.logDetail("JS => addBackDatedSponsorship tx hash = " + String(tx?.hash || ""));
    await logStructureSnapshot("after addBackDatedSponsorship send");
    context.spCoinLogger.logExitFunction();
    return tx;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    context.spCoinLogger.logDetail("JS => addBackDatedSponsorship failed: " + message);
    throw error;
  }
};
