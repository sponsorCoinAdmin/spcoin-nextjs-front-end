// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/erc20/read/index.ts
import { Contract } from 'ethers';
import { createSpCoinContract } from '../../shared';
import { method as allowance } from './methods/allowance';
import { method as balanceOf } from './methods/balanceOf';
import { method as decimals } from './methods/decimals';
import { method as name } from './methods/name';
import { method as symbol } from './methods/symbol';
import { method as totalSupply } from './methods/totalSupply';

export type Erc20ReadMethod = 'name' | 'symbol' | 'decimals' | 'totalSupply' | 'balanceOf' | 'allowance';

export type Erc20ReadLabels = {
  title: string;
  addressALabel: string;
  addressAPlaceholder: string;
  addressBLabel: string;
  addressBPlaceholder: string;
  requiresAddressA: boolean;
  requiresAddressB: boolean;
};

const METHODS = {
  name,
  symbol,
  decimals,
  totalSupply,
  balanceOf,
  allowance,
} as const;

export const ERC20_READ_OPTIONS = (Object.keys(METHODS) as Erc20ReadMethod[]).sort((a, b) => a.localeCompare(b));

export function getErc20ReadLabels(selectedReadMethod: Erc20ReadMethod): Erc20ReadLabels {
  return METHODS[selectedReadMethod].labels;
}

type RunArgs = {
  selectedReadMethod: Erc20ReadMethod;
  activeReadLabels: Erc20ReadLabels;
  readAddressA: string;
  readAddressB: string;
  requireContractAddress: () => string;
  ensureReadRunner: () => Promise<any>;
  appendLog: (line: string) => void;
  setStatus: (value: string) => void;
};

export async function runErc20ReadMethod(args: RunArgs): Promise<void> {
  const {
    selectedReadMethod,
    activeReadLabels,
    readAddressA,
    readAddressB,
    requireContractAddress,
    ensureReadRunner,
    appendLog,
    setStatus,
  } = args;

  const target = requireContractAddress();
  const runner = await ensureReadRunner();
  const contract = createSpCoinContract(target, runner) as Contract;
  const addressA = readAddressA.trim();
  const addressB = readAddressB.trim();

  if (activeReadLabels.requiresAddressA && !addressA) {
    throw new Error(`${activeReadLabels.addressALabel} is required.`);
  }
  if (activeReadLabels.requiresAddressB && !addressB) {
    throw new Error(`${activeReadLabels.addressBLabel} is required.`);
  }

  const fn = METHODS[selectedReadMethod];
  const result = await fn.run(contract, addressA, addressB);
  if (selectedReadMethod === 'allowance') {
    appendLog(`allowance(${addressA}, ${addressB}) -> ${String(result)}`);
  } else if (selectedReadMethod === 'balanceOf') {
    appendLog(`balanceOf(${addressA}) -> ${String(result)}`);
  } else {
    appendLog(`${selectedReadMethod}() -> ${String(result)}`);
  }
  setStatus(`${selectedReadMethod} read complete.`);
}
