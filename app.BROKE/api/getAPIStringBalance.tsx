import { getQueryVariable } from '../lib/utils'
import { fetchBigIntBalance, fetchStringBalance } from '../lib/wagmi/api/fetchBalance'
import { getURLParams } from './lib/getURLParams'

export const getAPIStringBalance = async(_url:string) => {
  const params = getURLParams(_url);
  let address  = getQueryVariable(params, "walletAddress")
  let token    = getQueryVariable(params, "tokenAddress")
  let chainId  = getQueryVariable(params, "chainId")

  let wagmiBalance = await fetchStringBalance(address, token, chainId)
  return wagmiBalance
}