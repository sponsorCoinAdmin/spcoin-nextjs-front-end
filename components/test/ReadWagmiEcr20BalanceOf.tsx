import React from 'react'
import { Address } from 'viem'
import { getERC20WagmiClientBalanceOf, getFormattedClientBalanceOf } from '@/lib/wagmi/erc20WagmiClientRead'

type Props = {
  ACTIVE_WALLET_ACCOUNT:Address, 
  TOKEN_CONTRACT:Address
}

const ReadWagmiEcr20BalanceOf = ({ ACTIVE_WALLET_ACCOUNT, TOKEN_CONTRACT}: Props) => {
  let balanceOf            = getERC20WagmiClientBalanceOf(ACTIVE_WALLET_ACCOUNT, TOKEN_CONTRACT || "")
  let formattedBalanceOf   = getFormattedClientBalanceOf(ACTIVE_WALLET_ACCOUNT, TOKEN_CONTRACT || "")
  return (
    <>
      <hr className="border-top: 3px dashed #bbb"/>
      <h2>For Wallet {ACTIVE_WALLET_ACCOUNT} Reading Wagmi Ecr20 BalanceOf {TOKEN_CONTRACT}</h2>
      BalanceOf               : {balanceOf} <br/>
      Formatted BalanceOf     : {formattedBalanceOf}
    </>
  )
}

export default ReadWagmiEcr20BalanceOf
