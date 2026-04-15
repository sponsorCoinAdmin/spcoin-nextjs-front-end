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
  const getErrorMessage = (error) => {
    if (error instanceof Error) {
      return error.message;
    }
    if (error && typeof error === "object" && typeof error.message === "string") {
      return error.message;
    }
    return String(error);
  };
  const isTransientFetchError = (error) => /failed to fetch/i.test(getErrorMessage(error));
  const hasTransactionHash = (error) =>
    Boolean(
      error?.transactionHash ||
        error?.transaction?.hash ||
        error?.receipt?.hash ||
        error?.receipt?.transactionHash
    );
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
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        if (attempt > 1) {
          context.spCoinLogger.logDetail(
            "JS => " + label + " retry send attempt #" + String(attempt)
          );
        }
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
        const shouldRetry =
          attempt < maxAttempts &&
          isTransientFetchError(error) &&
          !hasTransactionHash(error);
        if (!shouldRetry) {
          throw error;
        }
        context.spCoinLogger.logDetail(
          "JS => " + label + " transient fetch failure; waiting before retry"
        );
        await sleep(1000 * attempt);
      }
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
  const safeRead = async (label, loadValue, fallback) => {
    try {
      return await loadValue();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      context.spCoinLogger.logDetail("JS => " + label + " read failed: " + message);
      return fallback;
    }
  };
  const logStructureSnapshot = async (stageLabel) => {
    const snapshot = {};
    const getMasterAccountList =
      context.spCoinContractDeployed.getMasterAccountList ??
      context.spCoinContractDeployed.getAccountList;
    if (typeof getMasterAccountList === "function") {
      snapshot.accountList = await safeRead(
        "addAgentSponsorship accountList",
        () => getMasterAccountList(),
        []
      );
    }
    if (typeof context.spCoinContractDeployed.isAccountInserted === "function") {
      snapshot.sponsorInserted = await safeRead(
        "addAgentSponsorship sponsorInserted",
        () => context.spCoinContractDeployed.isAccountInserted(sponsorKey),
        null
      );
      snapshot.recipientInserted = await safeRead(
        "addAgentSponsorship recipientInserted",
        () => context.spCoinContractDeployed.isAccountInserted(_recipientKey),
        null
      );
      snapshot.agentInserted = await safeRead(
        "addAgentSponsorship agentInserted",
        () => context.spCoinContractDeployed.isAccountInserted(_accountAgentKey),
        null
      );
    }
    if (typeof context.spCoinContractDeployed.getAccountRecipientList === "function") {
      snapshot.sponsorRecipientList = await safeRead(
        "addAgentSponsorship sponsorRecipientList",
        () => context.spCoinContractDeployed.getAccountRecipientList(sponsorKey),
        []
      );
    }
    if (typeof context.spCoinContractDeployed.getRecipientRateList === "function") {
      snapshot.recipientRateList = await safeRead(
        "addAgentSponsorship recipientRateList",
        () => context.spCoinContractDeployed.getRecipientRateList(
          sponsorKey,
          _recipientKey
        ),
        []
      );
    }
    if (typeof context.spCoinContractDeployed.getRecipientRateAgentList === "function") {
      snapshot.recipientRateAgentList = await safeRead(
        "addAgentSponsorship recipientRateAgentList",
        () => context.spCoinContractDeployed.getRecipientRateAgentList(
          sponsorKey,
          _recipientKey,
          _recipientRateKey
        ),
        []
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
    context.spCoinLogger.logDetail("JS => addAgentSponsorship stage = addRecipient:start");
    await logStructureSnapshot("before addRecipient");
    const existingRecipientList =
      typeof context.spCoinContractDeployed.getAccountRecipientList === "function"
        ? toAddressList(await safeRead(
            "addAgentSponsorship existing sponsor recipient list",
            () => context.spCoinContractDeployed.getAccountRecipientList(sponsorKey),
            []
          ))
        : [];
    if (existingRecipientList.includes(String(_recipientKey || "").toLowerCase())) {
      context.spCoinLogger.logDetail("JS => addAgentSponsorship stage = addRecipient:skip-existing");
    } else {
      context.spCoinLogger.logDetail("JS => addAgentSponsorship stage = addRecipient:send");
      const addRecipientTx = await sendTxWithDiagnostics(
        "addSponsorRecipientBranch",
        () => context.spCoinContractDeployed.addSponsorRecipientBranch(sponsorKey, _recipientKey)
      );
      context.spCoinLogger.logDetail("JS => addRecipient tx hash = " + String(addRecipientTx?.hash || ""));
      context.spCoinLogger.logDetail("JS => addAgentSponsorship stage = addRecipient:wait");
      const addRecipientReceipt = await addRecipientTx.wait();
      ensureSuccessfulReceipt("addRecipient", addRecipientReceipt);
      context.spCoinLogger.logDetail("JS => addRecipient mined");
      context.spCoinLogger.logDetail("JS => addAgentSponsorship stage = addRecipient:settle");
      await sleep(1000);
    }
    if (typeof context.spCoinContractDeployed.isAccountInserted === "function") {
      context.spCoinLogger.logDetail("JS => addAgentSponsorship stage = addRecipient:check-inserted");
      await waitForVisibility(
        "addRecipient recipient account inserted",
        () => context.spCoinContractDeployed.isAccountInserted(_recipientKey),
        (value) => value === true
      );
    }
    if (typeof context.spCoinContractDeployed.getAccountRecipientList === "function") {
      context.spCoinLogger.logDetail("JS => addAgentSponsorship stage = addRecipient:check-recipient-list");
      await waitForVisibility(
        "addRecipient sponsor recipient list",
        () => context.spCoinContractDeployed.getAccountRecipientList(sponsorKey),
        (value) => toAddressList(value).includes(String(_recipientKey || "").toLowerCase())
      );
    }
    context.spCoinLogger.logDetail("JS => addAgentSponsorship stage = addRecipient:post-snapshot");
    await logStructureSnapshot("after addRecipient");
    context.spCoinLogger.logDetail("JS => addAgentSponsorship stage = addRecipient:complete");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    context.spCoinLogger.logDetail("JS => addRecipient failed: " + message);
    throw error;
  }

  try {
    context.spCoinLogger.logDetail("JS => addAgentSponsorship stage = addAgent:start");
    await logStructureSnapshot("before addAgent");
    const existingAgentList =
      typeof context.spCoinContractDeployed.getRecipientRateAgentList === "function"
        ? toAddressList(await safeRead(
            "addAgentSponsorship existing recipient rate agent list",
            () => context.spCoinContractDeployed.getRecipientRateAgentList(sponsorKey, _recipientKey, _recipientRateKey),
            []
          ))
        : [];
    if (existingAgentList.includes(String(_accountAgentKey || "").toLowerCase())) {
      context.spCoinLogger.logDetail("JS => addAgentSponsorship stage = addAgent:skip-existing");
    } else {
      context.spCoinLogger.logDetail("JS => addAgentSponsorship stage = addAgent:send");
      const addAgentTx = await sendTxWithDiagnostics(
        "addRecipientAgentBranch",
        () => context.spCoinContractDeployed.addRecipientAgentBranch(
          sponsorKey,
          _recipientKey,
          _recipientRateKey,
          _accountAgentKey
        )
      );
      context.spCoinLogger.logDetail("JS => addRecipientAgentBranch tx hash = " + String(addAgentTx?.hash || ""));
      context.spCoinLogger.logDetail("JS => addAgentSponsorship stage = addAgent:wait");
      const addAgentReceipt = await addAgentTx.wait();
      ensureSuccessfulReceipt("addRecipientAgentBranch", addAgentReceipt);
      context.spCoinLogger.logDetail("JS => addRecipientAgentBranch mined");
      context.spCoinLogger.logDetail("JS => addAgentSponsorship stage = addAgent:settle");
      await sleep(1000);
    }
    if (typeof context.spCoinContractDeployed.getRecipientRateAgentList === "function") {
      context.spCoinLogger.logDetail("JS => addAgentSponsorship stage = addAgent:check-agent-list");
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
    context.spCoinLogger.logDetail("JS => addAgentSponsorship stage = addAgent:post-snapshot");
    await logStructureSnapshot("after addAgent");
    context.spCoinLogger.logDetail("JS => addAgentSponsorship stage = addAgent:complete");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    context.spCoinLogger.logDetail("JS => addAgent failed: " + message);
    throw error;
  }

  try {
    context.spCoinLogger.logDetail("JS => addAgentSponsorship stage = addAgentRateBranchAmount:pre-snapshot");
    await logStructureSnapshot("pre-addAgentRateBranchAmount");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    context.spCoinLogger.logDetail("JS => post-addAgent diagnostics failed: " + message);
  }

  try {
    context.spCoinLogger.logDetail("JS => addAgentSponsorship stage = addAgentRateBranchAmount:send");
    const tx = await sendTxWithDiagnostics(
      "addAgentRateBranchAmount",
      () => context.spCoinContractDeployed.addAgentRateTransaction(
        sponsorKey,
        _recipientKey,
        _recipientRateKey,
        _accountAgentKey,
        _agentRateKey,
        wholePart,
        fractionalPart
      )
    );
    context.spCoinLogger.logDetail("JS => addAgentRateBranchAmount tx hash = " + String(tx?.hash || ""));
    context.spCoinLogger.logDetail("JS => addAgentSponsorship stage = addAgentRateBranchAmount:post-send-snapshot");
    await logStructureSnapshot("after addAgentRateBranchAmount send");
    context.spCoinLogger.logDetail("JS => addAgentSponsorship stage = addAgentRateBranchAmount:complete");
    context.spCoinLogger.logExitFunction();
    return tx;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    context.spCoinLogger.logDetail("JS => addAgentRateBranchAmount failed: " + message);
    throw error;
  }
};
