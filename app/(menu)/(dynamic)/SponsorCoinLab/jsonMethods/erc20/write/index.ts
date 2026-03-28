// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/erc20/write/index.ts
import type { Contract } from 'ethers';
import { method as approve } from './methods/approve';
import { method as transfer } from './methods/transfer';
import { method as transferFrom } from './methods/transferFrom';

export type Erc20WriteMethod = 'transfer' | 'approve' | 'transferFrom';

export type Erc20WriteLabels = {
  title: string;
  addressALabel: string;
  addressAPlaceholder: string;
  addressBLabel: string;
  addressBPlaceholder: string;
  requiresAddressB: boolean;
};

const METHODS = {
  transfer,
  approve,
  transferFrom,
} as const;

export const ERC20_WRITE_OPTIONS = (Object.keys(METHODS) as Erc20WriteMethod[]).sort((a, b) => a.localeCompare(b));

export function getErc20WriteLabels(selectedWriteMethod: Erc20WriteMethod): Erc20WriteLabels {
  return METHODS[selectedWriteMethod].labels;
}

type RunArgs = {
  selectedWriteMethod: Erc20WriteMethod;
  activeWriteLabels: Erc20WriteLabels;
  writeAddressA: string;
  writeAddressB: string;
  writeAmountRaw: string;
  selectedHardhatAddress?: string;
  executeWriteConnected: (
    label: string,
    writeCall: (contract: Contract, signer: any) => Promise<any>,
    accountKey?: string,
  ) => Promise<any>;
  appendLog: (line: string) => void;
  setStatus: (value: string) => void;
};

export async function runErc20WriteMethod(args: RunArgs): Promise<{
  txHash: string;
  receiptHash: string;
  blockNumber: string;
  status: string;
}> {
  const {
    selectedWriteMethod,
    activeWriteLabels,
    writeAddressA,
    writeAddressB,
    writeAmountRaw,
    selectedHardhatAddress,
    executeWriteConnected,
    appendLog,
    setStatus,
  } = args;

  const addressA = writeAddressA.trim();
  const addressB = writeAddressB.trim();
  const amount = writeAmountRaw.trim();

  if (!addressA) throw new Error(`${activeWriteLabels.addressALabel} is required.`);
  if (activeWriteLabels.requiresAddressB && !addressB) {
    throw new Error(`${activeWriteLabels.addressBLabel} is required.`);
  }
  if (!amount) throw new Error('Amount is required.');

  const fn = METHODS[selectedWriteMethod];
  const callLabel =
    selectedWriteMethod === 'transferFrom'
      ? `transferFrom(${addressA}, ${addressB}, ${amount})`
      : `${selectedWriteMethod}(${addressA}, ${amount})`;

  setStatus(`Submitting ${callLabel}...`);
  const tx = await executeWriteConnected(selectedWriteMethod, (contract) => fn.run(contract, addressA, addressB, amount), selectedHardhatAddress);
  appendLog(`${selectedWriteMethod} tx sent: ${String(tx?.hash || '(no hash)')}`);
  const receipt = await tx.wait();
  appendLog(`${selectedWriteMethod} mined: ${String(receipt?.hash || tx?.hash || '(no hash)')}`);
  setStatus(`${selectedWriteMethod} complete.`);
  return {
    txHash: String(tx?.hash || ''),
    receiptHash: String(receipt?.hash || tx?.hash || ''),
    blockNumber: String(receipt?.blockNumber ?? ''),
    status: String(receipt?.status ?? ''),
  };
}
