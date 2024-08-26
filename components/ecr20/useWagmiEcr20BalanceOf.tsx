import { Address } from 'viem'
import { getERC20WagmiClientBalanceOfStr, getFormattedClientBalanceOf, getERC20WagmiClientDecimals, formatDecimals } from '@/lib/wagmi/erc20WagmiClientRead'

const useWagmiEcr20BalanceOf = (ACTIVE_ACCOUNT_ADDRESS: string | undefined, TOKEN_CONTRACT_ADDRESS: string | undefined) => {
  const balanceOf             = getERC20WagmiClientBalanceOfStr(ACTIVE_ACCOUNT_ADDRESS, TOKEN_CONTRACT_ADDRESS || "")
  const decimals              = getERC20WagmiClientDecimals(TOKEN_CONTRACT_ADDRESS)
  const formattedBalanceOf    = getFormattedClientBalanceOf(ACTIVE_ACCOUNT_ADDRESS, TOKEN_CONTRACT_ADDRESS || "")
  console.debug(`ReadWagmiEcr20BalanceOf.decimals:TOKEN_CONTRACT_ADDRESS = ${TOKEN_CONTRACT_ADDRESS}`)

  return { balanceOf, decimals, formattedBalanceOf }

  // return (
  //   <>
  //     <hr className="border-top: 3px dashed #bbb"/>
  //     <h2>For Wallet {ACTIVE_ACCOUNT_ADDRESS}</h2>
  //     <h2>Reading Wagmi ERC20 Contract BalanceOf {TOKEN_CONTRACT_ADDRESS}</h2>
  //     BalanceOf              : {balanceOf} <br/>
  //     Decimals               : {decimals} <br/>
  //     Formatted BalanceOf    : {formattedBalanceOf}
  //   </>
  // )
}

export default useWagmiEcr20BalanceOf
