import { isAddress, parseUnits } from 'ethers'
import { Address, formatUnits, getAddress } from 'viem'
import { TokenContract } from '@/lib/structure/types'
import { BURN_ADDRESS } from '@/lib/network/utils'

const getQueryVariable = (_urlParams: string, _searchParam: string) => {
  const vars = _urlParams.split('&')
  for (const param of vars) {
    const pair = param.split('=')
    if (pair[0] === _searchParam) return pair[1]
  }
  console.error('*** ERROR *** Search Param Not Found:', _searchParam)
  return ''
}

const getValidBigIntToFormattedValue = (value: bigint | undefined, decimals: number | undefined) => {
  decimals = decimals || 0
  let stringValue: string = formatUnits(value || 0n, decimals)
  return parseValidFormattedAmount(stringValue, decimals)
}

const parseValidFormattedAmount = (value: string | bigint, decimals: number | undefined) => {
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

const setValidPriceInput = (txt: string, decimals: number, setSellAmount: (amount: bigint) => void) => {
  txt = parseValidFormattedAmount(txt, decimals)
  if (!isNaN(Number(txt))) setSellAmount(parseUnits(txt, decimals))
  return txt
}

const getValidAddress = (addrType: any, chainId?: number) => {
  try {
    return getAddress(addrType.trim(), chainId)
  } catch (err: any) {
    if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
      console.error(`ERROR: getAddress(${addrType}, ${chainId})`, err.message)
    }
    return undefined
  }
}

const decimalAdjustTokenAmount = (
  amount: bigint,
  newTokenContract: TokenContract | undefined,
  prevTokenContract: TokenContract | undefined
) => {
  const decimalShift: number = (newTokenContract?.decimals || 0) - (prevTokenContract?.decimals || 0)
  return bigIntDecimalShift(amount, decimalShift)
}

const bigIntDecimalShift = (value: bigint, decimalShift: number) => {
  return decimalShift === 0
    ? BigInt(value)
    : decimalShift >= 0
    ? BigInt(value) * BigInt(10 ** Math.abs(decimalShift))
    : BigInt(value) / BigInt(10 ** Math.abs(decimalShift))
}

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
  bigIntDecimalShift,
  decimalAdjustTokenAmount,
  getQueryVariable,
  getValidAddress,
  getValidBigIntToFormattedValue,
  parseValidFormattedAmount,
  setValidPriceInput,
  invalidTokenContract,
}
