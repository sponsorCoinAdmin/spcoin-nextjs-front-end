import type { SpCoinReadMethod } from '../jsonMethods/spCoin/read';

function toDisplayString(value: unknown, fallback = '') {
  if (value == null) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint' || typeof value === 'boolean') return String(value);
  return fallback;
}

export function mergeFormattedOutput(nextBlock: string, baseOutput?: string) {
  const current = toDisplayString(baseOutput).trim();
  if (!current || current === '(no output yet)') return nextBlock;
  return `${current}\n\n${nextBlock}`;
}

export function normalizeWriteResultForDisplay(result: unknown) {
  if (result === undefined || result === null) {
    return {
      status: 'success',
      message: 'Completed successfully.',
    };
  }
  if (Array.isArray(result) && result.length === 0) {
    return {
      status: 'success',
      message: 'Completed successfully.',
    };
  }
  if (
    Array.isArray(result) &&
    result.every(
      (entry) =>
        entry &&
        typeof entry === 'object' &&
        !Array.isArray(entry) &&
        ('txHash' in (entry as Record<string, unknown>) || 'receiptHash' in (entry as Record<string, unknown>)),
    )
  ) {
    const receipts = result as Record<string, unknown>[];
    if (receipts.length === 1) {
      const [receipt] = receipts;
      return {
        status: toDisplayString(receipt.status, 'success'),
        message: 'Completed successfully.',
        label: toDisplayString(receipt.label),
        transactionId: toDisplayString(receipt.txHash),
        receiptId: toDisplayString(receipt.receiptHash),
        blockNumber: toDisplayString(receipt.blockNumber),
      };
    }
    return {
      status: 'success',
      message: `Completed ${receipts.length} transaction(s).`,
      transactionCount: String(receipts.length),
      transactions: receipts.map((receipt) => ({
        label: toDisplayString(receipt.label),
        transactionId: toDisplayString(receipt.txHash),
        receiptId: toDisplayString(receipt.receiptHash),
        blockNumber: toDisplayString(receipt.blockNumber),
        status: toDisplayString(receipt.status),
      })),
    };
  }
  return result;
}

export function deriveReadWarningPayload(
  selectedMethod: SpCoinReadMethod,
  result: unknown,
  useLocalSpCoinAccessPackage: boolean,
) {
  const selectedMethodName = String(selectedMethod ?? '').trim();
  if (
    result &&
    typeof result === 'object' &&
    !Array.isArray(result) &&
    toDisplayString((result as Record<string, unknown>).__spcoinWarningType).trim() === 'malformed_rate_reward_list'
  ) {
    return {
      type: 'invalid_input',
      message: toDisplayString(
        (result as Record<string, unknown>).__spcoinWarningMessage,
        `${selectedMethodName} received malformed rate reward data and returned an empty list.`,
      ),
      debug: {
        panel: 'spcoin_rread',
        source: useLocalSpCoinAccessPackage ? 'local' : 'node_modules',
        method: selectedMethodName,
      },
    };
  }
  if (
    selectedMethodName === 'getAccountTransactionList' &&
    Array.isArray(result) &&
    result.length === 0
  ) {
    return {
      type: 'empty_data',
      message: `${selectedMethodName} returned no rate reward data for the supplied list.`,
      debug: {
        panel: 'spcoin_rread',
        source: useLocalSpCoinAccessPackage ? 'local' : 'node_modules',
        method: selectedMethodName,
      },
    };
  }
  if (
    (selectedMethod === 'getAgentTransaction' || selectedMethod === 'getRecipientTransaction') &&
    result &&
    typeof result === 'object' &&
    !Array.isArray(result)
  ) {
    const record = result as Record<string, unknown>;
    if (record.inserted === false) {
      return {
        type: 'not_found',
        message: `${selectedMethod} returned no onchain branch for the supplied keys.`,
        debug: {
          panel: 'spcoin_rread',
          source: useLocalSpCoinAccessPackage ? 'local' : 'node_modules',
          method: selectedMethod,
        },
      };
    }
  }
  if (
    selectedMethodName === 'getAccountRecord' &&
    result &&
    typeof result === 'object' &&
    !Array.isArray(result)
  ) {
    const record = result as Record<string, unknown>;
    const totalSpCoins =
      record.totalSpCoins && typeof record.totalSpCoins === 'object' && !Array.isArray(record.totalSpCoins)
        ? (record.totalSpCoins as Record<string, unknown>)
        : null;
    const recipientKeys = Array.isArray(record.recipientKeys) ? record.recipientKeys : [];
    const agentKeys = Array.isArray(record.agentKeys) ? record.agentKeys : [];
    const accountBalance = toDisplayString(record.accountBalance ?? record.balanceOf, '0').trim();
    const stakedAccountSPCoins = toDisplayString(record.stakedAccountSPCoins ?? record.stakedSPCoins, '0').trim();
    const hasCountFields =
      'sponsorCount' in record ||
      'recipientCount' in record ||
      'agentCount' in record ||
      'parentRecipientCount' in record ||
      'active' in record;
    const isEmptyAccountRecord =
      !hasCountFields &&
      ['', '0'].includes(toDisplayString(record.creationTime).trim()) &&
      toDisplayString(totalSpCoins?.totalSpCoins, '0').trim() === '0' &&
      accountBalance === '0' &&
      stakedAccountSPCoins === '0' &&
      recipientKeys.length === 0 &&
      agentKeys.length === 0;
    if (isEmptyAccountRecord) {
      return {
        type: 'not_found',
        message: `${selectedMethodName} returned no account record for the supplied account key.`,
        debug: {
          panel: 'spcoin_rread',
          source: useLocalSpCoinAccessPackage ? 'local' : 'node_modules',
          method: selectedMethodName,
        },
      };
    }
  }
  return undefined;
}
