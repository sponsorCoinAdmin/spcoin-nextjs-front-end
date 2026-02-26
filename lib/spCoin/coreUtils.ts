// File: @/lib/spCoin/coreUtils.ts

import { parseUnits, formatUnits, getAddress } from 'viem';
import { BURN_ADDRESS } from '@/lib/structure/constants/addresses';
import { CHAIN_ID } from '@/lib/structure/enums/networkIds';
import type { TokenContract } from '@/lib/structure';

/**
 * Parse a user-entered string or bigint into a formatted string value (safe for UI display).
 */
export const parseValidFormattedAmount = (
  value: string | bigint,
  decimals: number | undefined,
): string => {
  decimals = decimals || 0;

  let price: string;

  if (typeof value === 'string') {
    price = value.startsWith('.') ? '0' + value : value;
  } else {
    price = formatUnits(value || 0n, decimals);
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
  decimals = decimals || 0;
  const stringValue = formatUnits(value || 0n, decimals);
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

  const chainId = Number(tokenContract.chainId ?? CHAIN_ID.ETHEREUM);
  const supported = [
    CHAIN_ID.BASE,
    CHAIN_ID.ETHEREUM,
    CHAIN_ID.POLYGON,
    CHAIN_ID.HARDHAT_BASE,
    CHAIN_ID.SEPOLIA,
  ].includes(chainId);

  if (!supported) return false;

  try {
    // checksum-compare
    return (
      getAddress(tokenContract.address) ===
      getAddress('0xC2816250c07aE56c1583E5f2b0E67F7D7F42D562')
    );
  } catch {
    return false;
  }
};

/**
 * Convenience helpers for TradeData-like objects.
 * These are intentionally light-weight and only depend on TokenContract shape.
 */
type TradeDataLike = {
  sellTokenContract?: TokenContract;
  buyTokenContract?: TokenContract;
};

const isSellSpCoin = (tradeData: TradeDataLike | undefined): boolean =>
  isSpCoin(tradeData?.sellTokenContract);

const isBuySpCoin = (tradeData: TradeDataLike | undefined): boolean =>
  isSpCoin(tradeData?.buyTokenContract);

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
    (newTokenContract?.decimals || 0) - (prevTokenContract?.decimals || 0);
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
  bigIntDecimalShift,
  decimalAdjustTokenAmount,
  invalidTokenContract,
};
