import React from 'react'
import { Address } from 'viem'
import { getERC20WagmiClientBalanceOf, getFormattedClientBalanceOf } from '@/lib/wagmi/erc20WagmiClientRead'

type Props = {
  ACTIVE_ACCOUNT_ADDRESS:Address, 
  TOKEN_CONTRACT:Address
}

const ReadWagmiEcr20BalanceOf = ({ ACTIVE_ACCOUNT_ADDRESS, TOKEN_CONTRACT}: Props) => {
  let balanceOf            = getERC20WagmiClientBalanceOf(ACTIVE_ACCOUNT_ADDRESS, TOKEN_CONTRACT || "")
  let formattedBalanceOf   = getFormattedClientBalanceOf(ACTIVE_ACCOUNT_ADDRESS, TOKEN_CONTRACT || "")
  return (
    <>
      <hr className="border-top: 3px dashed #bbb"/>
      <h2>For Wallet {ACTIVE_ACCOUNT_ADDRESS} Reading Wagmi ERC20 BalanceOf {TOKEN_CONTRACT}</h2>
      BalanceOf               : {balanceOf} <br/>
      Formatted BalanceOf     : {formattedBalanceOf}
    </>
  )
}

export default ReadWagmiEcr20BalanceOf
