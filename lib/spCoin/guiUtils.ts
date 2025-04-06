import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils'
import { ExchangeContext, TokenContract } from '@/lib/structure/types'
import { toggleElement } from './guiControl'
import { getWagmiBalanceOfRec } from '@/lib/wagmi/getWagmiBalanceOfRec'
import { isAddress } from 'ethers'
import { Address } from 'viem'

/**
 * Alert-style dump of full exchange context.
 */
const exchangeContextDump = (exchangeContext: ExchangeContext) => {
  const exchangeData = stringifyBigInt(exchangeContext)
  if (typeof window !== 'undefined') {
    alert(exchangeData)
  }
  toggleElement('AddSponsorshipButton_ID')
  console.log(exchangeData)
}

/**
 * General-purpose object logger with optional alert.
 */
const logAlert = (obj: any, name = '', showAlert = false, showConsole = true): string => {
  const objStr = name ? `${name}: ${stringifyBigInt(obj)}` : stringifyBigInt(obj)
  if (showConsole) console.debug(objStr)
  if (showAlert && typeof window !== 'undefined') alert(objStr)
  return objStr
}

/**
 * Fetch and build a TokenContract from the blockchain.
 */
const fetchTokenDetails = async (
  chainId: number,
  tokenAddr: string
): Promise<TokenContract | undefined> => {
  const tokenIconPath = `assets/blockchains/${tokenAddr}.png`
  let tokenContract: TokenContract | undefined

  try {
    if (isAddress(tokenAddr)) {
      const retResponse = await getWagmiBalanceOfRec(tokenAddr)

      tokenContract = {
        chainId,
        address: tokenAddr as Address,
        symbol: retResponse.symbol,
        amount: 0n,
        decimals: retResponse.decimals,
        balance: 0n,
        totalSupply: undefined,
        img: tokenIconPath,
      }
    }
  } catch (e: any) {
    console.error('SELL_ERROR: fetchTokenDetails:', e.message)
  }

  return tokenContract
}

/**
 * High-level wrapper to fetch token details and store them with a callback.
 */
const getTokenDetails = async (
  chainId: number,
  tokenAddr: string,
  setTokenCallback: (token: TokenContract) => void
): Promise<TokenContract | undefined> => {
  const tokenContract = await fetchTokenDetails(chainId, tokenAddr)
  if (tokenContract) setTokenCallback(tokenContract)
  return tokenContract
}

/**
 * Show a user-facing alert about the current swap state.
 */
const dumpSwapState = (swapType: any) => {
  if (typeof window !== 'undefined') {
    alert(`Swap Type: ${swapType}`)
  }
}

/**
 * Refresh a user's token balance in the UI.
 */
const updateBalance = async (
  connectedAccountAddr: string | undefined | null,
  tokenContract: TokenContract,
  setBalance: (balance: string) => void
) => {
  let success = false
  let balance: string = 'N/A'
  let errMsg = 'N/A'

  if (connectedAccountAddr) {
    try {
      const retResponse = await getWagmiBalanceOfRec(tokenContract.address)
      balance = retResponse.formatted
      setBalance(balance)
      success = true
    } catch (error) {
      console.error('Error fetching balance:', error)
      errMsg = 'Error fetching balance'
    }
  } else {
    errMsg = 'Wallet Connection Required for Balance'
  }

  return { success, errMsg, balance }
}

/**
 * Builds a public-facing asset URL based on the environment config.
 */
const getPublicFileUrl = (fileName: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
  if (!baseUrl) throw new Error('NEXT_PUBLIC_BASE_URL is not defined in environment variables.')
  return `${baseUrl}/${fileName}`
}

export {
  exchangeContextDump,
  logAlert,
  fetchTokenDetails,
  getTokenDetails,
  dumpSwapState,
  updateBalance,
  getPublicFileUrl,
}
