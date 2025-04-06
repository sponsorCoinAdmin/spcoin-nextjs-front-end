import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils'
import { ExchangeContext, TokenContract } from '@/lib/structure/types'
import { toggleElement } from './guiControl'
import { getWagmiBalanceOfRec } from '@/lib/wagmi/getWagmiBalanceOfRec'

const dumpSwapState = (swapType: any) => {
  if (typeof window !== 'undefined') {
    alert(`Swap Type: ${swapType}`)
  }
}

const exchangeContextDump = (exchangeContext: ExchangeContext) => {
  const exchangeData = stringifyBigInt(exchangeContext)
  if (typeof window !== 'undefined') {
    alert(exchangeData)
  }
  toggleElement('AddSponsorshipButton_ID')
  console.log(exchangeData)
}

const logAlert = (obj: any, name: string = '', logAlert: boolean = false, logConsole: boolean = true): string => {
  const objStr = name ? `${name}: ${stringifyBigInt(obj)}` : stringifyBigInt(obj)
  if (logConsole) console.debug(objStr)
  if (logAlert && typeof window !== 'undefined') alert(objStr)
  return objStr
}

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
      let retResponse: any = await getWagmiBalanceOfRec(tokenContract.address)
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

export { dumpSwapState, exchangeContextDump, logAlert, updateBalance }
