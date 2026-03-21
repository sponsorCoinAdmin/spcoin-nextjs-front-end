// File: lib/spCoin/coreUtils.ts

import { parseUnits, formatUnits, getAddress } from 'viem';
import { BURN_ADDRESS } from '@/lib/structure/constants/addresses';
import { CHAIN_ID } from '@/lib/structure/enums/networkIds';
import type { TokenContract } from '@/lib/structure';
import { normalizeAddress } from '@/lib/utils/address';
import { resolveTokenAssetChainId } from '@/lib/utils/network/tokenAssetChainMap';
import spCoinDeploymentMapRaw from '@/resources/data/networks/spCoinDeployment.json';

type SpCoinDeploymentFile = {
  chainId?: Record<string, Record<string, unknown>>;
};

const spCoinAddressSetsByChain = (() => {
  const deploymentMap = (spCoinDeploymentMapRaw as SpCoinDeploymentFile) ?? {};
  const byChain = new Map<number, Set<string>>();

  const addAddress = (chainId: number, address: string) => {
    if (!Number.isFinite(chainId) || chainId <= 0) return;
    try {
      const normalizedAddress = getAddress(normalizeAddress(address));
      const existing = byChain.get(chainId) ?? new Set<string>();
      existing.add(normalizedAddress);
      byChain.set(chainId, existing);
    } catch {
      // Ignore invalid deployment-map addresses.
    }
  };

  const visitAddressNode = (chainId: number, node: unknown) => {
    if (!node || typeof node !== 'object') return;
    for (const [address, entry] of Object.entries(node as Record<string, unknown>)) {
      if (/^0[xX][0-9a-fA-F]{40}$/.test(address)) {
        addAddress(chainId, address);
        continue;
      }
      if (entry && typeof entry === 'object') {
        visitAddressNode(chainId, entry);
      }
    }
  };

  for (const [chainIdKey, chainNode] of Object.entries(deploymentMap.chainId ?? {})) {
    const chainId = Number(chainIdKey);
    if (!Number.isFinite(chainId) || !chainNode || typeof chainNode !== 'object') continue;
    visitAddressNode(chainId, chainNode);
  }

  return byChain;
})();

const spCoinAddressListsByChain = (() => {
  const deploymentMap = (spCoinDeploymentMapRaw as SpCoinDeploymentFile) ?? {};
  const byChain = new Map<number, string[]>();

  const addAddress = (chainId: number, address: string) => {
    if (!Number.isFinite(chainId) || chainId <= 0) return;
    try {
      const normalizedAddress = getAddress(normalizeAddress(address));
      const existing = byChain.get(chainId) ?? [];
      if (!existing.includes(normalizedAddress)) {
        existing.push(normalizedAddress);
        byChain.set(chainId, existing);
      }
    } catch {
      // Ignore invalid deployment-map addresses.
    }
  };

  const visitAddressNode = (chainId: number, node: unknown) => {
    if (!node || typeof node !== 'object') return;
    for (const [address, entry] of Object.entries(node as Record<string, unknown>)) {
      if (/^0[xX][0-9a-fA-F]{40}$/.test(address)) {
        addAddress(chainId, address);
        continue;
      }
      if (entry && typeof entry === 'object') {
        visitAddressNode(chainId, entry);
      }
    }
  };

  for (const [chainIdKey, chainNode] of Object.entries(deploymentMap.chainId ?? {})) {
    const chainId = Number(chainIdKey);
    if (!Number.isFinite(chainId) || !chainNode || typeof chainNode !== 'object') continue;
    visitAddressNode(chainId, chainNode);
  }

  return byChain;
})();

/**
 * Parse a user-entered string or bigint into a formatted string value (safe for UI display).
 */
export const parseValidFormattedAmount = (
  value: string | bigint,
  decimals: number | undefined,
): string => {
  decimals = decimals ?? 0;

  let price: string;

  if (typeof value === 'string') {
    price = value.startsWith('.') ? '0' + value : value;
  } else {
    price = formatUnits(value ?? 0n, decimals);
  }

  // Accepts "", "0", "0.", ".1", "2.000", etc.
  const re = /^\d*(?:[.,]\d*)?$/;

  if (price === '' || re.test(price)) {
    const [intPart, decimalPart] = price.replace(',', '.').split('.');

    let formattedValue = (intPart || '0').replace(/^0+/, '') || '0';

    if (decimalPart !== undefined) {
      // ✅ Preserve trailing zeros
      formattedValue += '.' + decimalPart;
    } else if (price.endsWith('.')) {
      // ✅ Preserve the trailing decimal
      formattedValue += '.';
    }

    return formattedValue;
  }

  return '0';
};

/** ── DOM helpers ────────────────────────────────────────────────────────── */
const getEl = (id: string): HTMLElement | null =>
  typeof document !== 'undefined' ? document.getElementById(id) : null;

const hideElement = (id: string): boolean => {
  const el = getEl(id);
  if (!el) return false;
  el.style.display = 'none';
  return true;
};

const showElement = (id: string): boolean => {
  const el = getEl(id);
  if (!el) return false;
  el.style.display = 'block';
  return true;
};

const toggleElement = (id: string): boolean => {
  const el = getEl(id);
  if (!el) return false;
  el.style.display = el.style.display === 'block' ? 'none' : 'block';
  return true;
};

/**
 * Given a bigint and decimals, return a formatted string and parse it back to bigint.
 */
const getValidBigIntToFormattedValue = (
  value: bigint | undefined,
  decimals: number | undefined,
): string => {
  decimals = decimals ?? 0;
  const stringValue = formatUnits(value ?? 0n, decimals);
  return parseValidFormattedAmount(stringValue, decimals);
};

/**
 * Format and parse user-entered token values, enforcing precision, then convert to bigint.
 */
const setValidPriceInput = (
  txt: string,
  decimals: number,
  setSellAmount: (amount: bigint) => void,
): string => {
  txt = parseValidFormattedAmount(txt, decimals);
  if (!isNaN(Number(txt))) {
    setSellAmount(parseUnits(txt, decimals));
  }
  return txt;
};

/**
 * Parses a query string param from the URL.
 */
const getQueryVariable = (_urlParams: string, _searchParam: string): string => {
  const vars = _urlParams.split('&');
  for (const param of vars) {
    const pair = param.split('=');
    if (pair[0] === _searchParam) return pair[1];
  }
  // eslint-disable-next-line no-console
  console.error('*** ERROR *** Search Param Not Found:', _searchParam);
  return '';
};

/**
 * Check if a TokenContract is recognized as SpCoin.
 */
const isSpCoin = (tokenContract: TokenContract | undefined): boolean => {
  if (!tokenContract?.address) return false;
  try {
    const normalized = getAddress(normalizeAddress(tokenContract.address));
    const rawChainId = Number(tokenContract.chainId ?? 0);
    const candidateChainIds = new Set<number>();

    if (Number.isFinite(rawChainId) && rawChainId > 0) {
      candidateChainIds.add(rawChainId);
      candidateChainIds.add(resolveTokenAssetChainId(rawChainId));
    } else {
      candidateChainIds.add(CHAIN_ID.ETHEREUM);
      candidateChainIds.add(CHAIN_ID.POLYGON);
      candidateChainIds.add(CHAIN_ID.BASE);
      candidateChainIds.add(CHAIN_ID.HARDHAT_BASE);
      candidateChainIds.add(CHAIN_ID.SEPOLIA);
    }

    for (const candidateChainId of candidateChainIds) {
      if (spCoinAddressSetsByChain.get(candidateChainId)?.has(normalized)) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
};

/**
 * Convenience helpers for TradeData-like objects.
 * These are intentionally light-weight and only depend on TokenContract shape.
 */
interface TradeDataLike {
  sellTokenContract?: TokenContract;
  buyTokenContract?: TokenContract;
}

const isSellSpCoin = (tradeData: TradeDataLike | undefined): boolean =>
  isSpCoin(tradeData?.sellTokenContract);

const isBuySpCoin = (tradeData: TradeDataLike | undefined): boolean =>
  isSpCoin(tradeData?.buyTokenContract);

const getPreferredSpCoinContractAddress = (
  chainId: number | undefined,
  tradeData?: TradeDataLike,
): string | undefined => {
  const preferredTradeToken = isBuySpCoin(tradeData)
    ? tradeData?.buyTokenContract
    : isSellSpCoin(tradeData)
    ? tradeData?.sellTokenContract
    : undefined;

  if (preferredTradeToken?.address) {
    try {
      return getAddress(normalizeAddress(preferredTradeToken.address));
    } catch {
      // Fall through to deployment map selection.
    }
  }

  const chainIdNum = Number(chainId ?? 0);
  if (!Number.isFinite(chainIdNum) || chainIdNum <= 0) return undefined;
  const addresses = spCoinAddressListsByChain.get(chainIdNum) ?? [];
  return addresses.length > 0 ? addresses[addresses.length - 1] : undefined;
};

/**
 * Convert between different token decimals using a bigint shift.
 */
const bigIntDecimalShift = (value: bigint, decimalShift: number): bigint => {
  if (decimalShift === 0) return BigInt(value);
  const factor = 10n ** BigInt(Math.abs(decimalShift));
  return decimalShift > 0 ? BigInt(value) * factor : BigInt(value) / factor;
};

/**
 * Apply decimal adjustment between two TokenContracts.
 */
const decimalAdjustTokenAmount = (
  amount: bigint,
  newTokenContract: TokenContract | undefined,
  prevTokenContract: TokenContract | undefined,
): bigint => {
  const decimalShift: number =
    (newTokenContract?.decimals ?? 0) - (prevTokenContract?.decimals ?? 0);
  return bigIntDecimalShift(amount, decimalShift);
};

/**
 * Return a stub TokenContract when the address is invalid.
 */
const invalidTokenContract = (
  textInputField: string | undefined,
  chainId: number,
): TokenContract | undefined => {
  return textInputField
    ? {
        chainId,
        address: BURN_ADDRESS,
        name: 'Invalid Network/Token Address',
        symbol: 'Please Enter Valid Token Address',
        decimals: undefined,
        balance: 0n,
        totalSupply: undefined,
        logoURL: undefined,
        amount: 0n,
      }
    : undefined;
};

export {
  hideElement,
  showElement,
  toggleElement,
  getValidBigIntToFormattedValue,
  setValidPriceInput,
  getQueryVariable,
  isSpCoin,
  isSellSpCoin,
  isBuySpCoin,
  getPreferredSpCoinContractAddress,
  bigIntDecimalShift,
  decimalAdjustTokenAmount,
  invalidTokenContract,
};
