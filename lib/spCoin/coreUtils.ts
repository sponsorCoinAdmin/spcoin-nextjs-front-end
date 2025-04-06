import { isAddress, parseUnits } from 'ethers'
import { Address, formatUnits, getAddress } from 'viem'
import { TokenContract } from '@/lib/structure/types'
import { BURN_ADDRESS } from '@/lib/network/utils'

/**
 * Parse a user-entered string or bigint into a formatted string value (safe for UI display).
 */
const parseValidFormattedAmount = (value: string | bigint, decimals: number | undefined): string => {
  decimals = decimals || 0
  const price: string = typeof value === 'string' ? value : formatUnits(value || 0n, decimals)
  const re = /^-?\d+(?:[.,]\d*?)?$/
  if (price === '' || re.test(price)) {
    let splitText = price.split('.')
    let formattedValue: string = splitText[0].replace(/^0+/, '') || '0'
    if (splitText[1] !== undefined) {
      formattedValue += '.' + splitText[1].substring(0, decimals)
    }
    return formattedValue
  }
  return '0'
}

/**
 * Given a bigint and decimals, return a formatted string and parse it back to bigint.
 */
const getValidBigIntToFormattedValue = (value: bigint | undefined, decimals: number | undefined): string => {
  decimals = decimals || 0
  const stringValue = formatUnits(value || 0n, decimals)
  return parseValidFormattedAmount(stringValue, decimals)
}

/**
 * Format and parse user-entered token values, enforcing precision, then convert to bigint.
 */
const setValidPriceInput = (txt: string, decimals: number, setSellAmount: (amount: bigint) => void): string => {
  txt = parseValidFormattedAmount(txt, decimals)
  if (!isNaN(Number(txt))) {
    setSellAmount(parseUnits(txt, decimals))
  }
  return txt
}

/**
 * Parses a query string param from the URL.
 */
const getQueryVariable = (_urlParams: string, _searchParam: string): string => {
  const vars = _urlParams.split('&')
  for (const param of vars) {
    const pair = param.split('=')
    if (pair[0] === _searchParam) return pair[1]
  }
  console.error('*** ERROR *** Search Param Not Found:', _searchParam)
  return ''
}

/**
 * Get a normalized address if valid, otherwise return undefined.
 */
const getValidAddress = (addrType: any, chainId?: number): Address | undefined => {
  if (!addrType || typeof addrType !== 'string') {
    if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
      console.warn(`WARN: getValidAddress called with invalid addrType:`, addrType)
    }
    return undefined
  }

  try {
    return getAddress(addrType.trim(), chainId)
  } catch (err: any) {
    if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
      console.error(`ERROR: getAddress(${addrType}, ${chainId})`, err.message)
    }
    return undefined
  }
}


/**
 * Check if a TokenContract is recognized as SpCoin.
 */
const isSpCoin = (tokenContract: TokenContract | undefined): boolean => {
  return tokenContract?.symbol === 'SpCoin'
}

/**
 * Convert between different token decimals using a bigint shift.
 */
const bigIntDecimalShift = (value: bigint, decimalShift: number): bigint => {
  return decimalShift === 0
    ? BigInt(value)
    : decimalShift >= 0
    ? BigInt(value) * BigInt(10 ** Math.abs(decimalShift))
    : BigInt(value) / BigInt(10 ** Math.abs(decimalShift))
}

/**
 * Apply decimal adjustment between two TokenContracts.
 */
const decimalAdjustTokenAmount = (
  amount: bigint,
  newTokenContract: TokenContract | undefined,
  prevTokenContract: TokenContract | undefined
): bigint => {
  const decimalShift: number = (newTokenContract?.decimals || 0) - (prevTokenContract?.decimals || 0)
  return bigIntDecimalShift(amount, decimalShift)
}

/**
 * Return a stub TokenContract when the address is invalid.
 */
const invalidTokenContract = (textInputField: string | undefined, chainId: number): TokenContract | undefined => {
  return textInputField
    ? {
        chainId,
        address: BURN_ADDRESS,
        name: 'Invalid Network/Token Address',
        symbol: 'Please Enter Valid Token Address',
        decimals: undefined,
        balance: 0n,
        totalSupply: undefined,
        img: undefined,
        amount: 0n,
      }
    : undefined
}

export {
  parseValidFormattedAmount,
  getValidBigIntToFormattedValue,
  setValidPriceInput,
  getQueryVariable,
  getValidAddress,
  isSpCoin,
  bigIntDecimalShift,
  decimalAdjustTokenAmount,
  invalidTokenContract,
}
