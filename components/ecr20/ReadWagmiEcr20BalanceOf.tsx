import React, { useEffect, useState } from 'react'
import { Address } from 'viem'
import { getERC20WagmiClientBalanceOfStr, getFormattedClientBalanceOf, getERC20WagmiClientDecimals, formatDecimals } from '@/lib/wagmi/erc20WagmiClientRead'

type Props = {
  ACTIVE_ACCOUNT_ADDRESS:Address|string|undefined, 
  TOKEN_CONTRACT_ADDRESS:Address|undefined
}

const ReadWagmiEcr20BalanceOf = ({ ACTIVE_ACCOUNT_ADDRESS, TOKEN_CONTRACT_ADDRESS}: Props) => {
  const balanceOf             = getERC20WagmiClientBalanceOfStr(ACTIVE_ACCOUNT_ADDRESS, TOKEN_CONTRACT_ADDRESS || "")
  const decimals              = getERC20WagmiClientDecimals(TOKEN_CONTRACT_ADDRESS)
  const formattedBalanceOf    = getFormattedClientBalanceOf(ACTIVE_ACCOUNT_ADDRESS, TOKEN_CONTRACT_ADDRESS || "")
  console.debug(`ReadWagmiEcr20BalanceOf.decimals:TOKEN_CONTRACT_ADDRESS = ${TOKEN_CONTRACT_ADDRESS}`)

  return (
    <>
      <hr className="border-top: 3px dashed #bbb"/>
      <h2>For Wallet {ACTIVE_ACCOUNT_ADDRESS}</h2>
      <h2>Reading Wagmi ERC20 Contract BalanceOf {TOKEN_CONTRACT_ADDRESS}</h2>
      BalanceOf              : {balanceOf} <br/>
      Decimals               : {decimals} <br/>
      Formatted BalanceOf    : {formattedBalanceOf}
    </>
  )
}

export default ReadWagmiEcr20BalanceOf
