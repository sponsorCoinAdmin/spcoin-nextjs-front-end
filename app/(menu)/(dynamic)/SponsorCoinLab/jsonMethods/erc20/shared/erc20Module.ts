import type { Contract } from 'ethers';
import { SpCoinERC20Module } from '../../../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/modules/spCoinERC20Module/index';

export type Erc20ModuleAccess = {
  name: () => Promise<unknown>;
  symbol: () => Promise<unknown>;
  decimals: () => Promise<unknown>;
  totalSupply: () => Promise<unknown>;
  balanceOf: (owner: string) => Promise<unknown>;
  allowance: (owner: string, spender: string) => Promise<unknown>;
  transfer: (to: string, value: string) => Promise<any>;
  approve: (spender: string, value: string) => Promise<any>;
  transferFrom: (from: string, to: string, value: string) => Promise<any>;
};

export function createErc20Module(contract: Contract): Erc20ModuleAccess {
  return new SpCoinERC20Module(contract) as Erc20ModuleAccess;
}
