import React from 'react'
import { Address } from 'viem'
import {
    getERC20WagmiClientDecimals,
    getERC20WagmiClientName,
    getERC20WagmiClientSymbol,
    getERC20WagmiClientTotalSupply,
    getFormattedClientTotalSupply } from '@/lib/wagmi/erc20WagmiClientRead'

type Props = {
  TOKEN_CONTRACT_ADDRESS:Address
}

const ReadWagmiEcr20Fields = ({ TOKEN_CONTRACT_ADDRESS}: Props) => {
  const name                 = getERC20WagmiClientName(TOKEN_CONTRACT_ADDRESS)
  const symbol               = getERC20WagmiClientSymbol(TOKEN_CONTRACT_ADDRESS)
  const decimals             = getERC20WagmiClientDecimals(TOKEN_CONTRACT_ADDRESS)
  const totalSupply          = getERC20WagmiClientTotalSupply(TOKEN_CONTRACT_ADDRESS)?.toString()
  const formattedTotalSupply = getFormattedClientTotalSupply(TOKEN_CONTRACT_ADDRESS)
  return (
    <>
      <hr className="border-top: 3px dashed #bbb"/>
      <h2>Read Wagmi ERC20 Fields for Token Contract({TOKEN_CONTRACT_ADDRESS})</h2>
      Token Name              : {name} <br/>
      Symbol                  : {symbol} <br/>
      Decimals                : {decimals} <br/>
      Total Supply            : {totalSupply} <br/>
      Formatted Total Supply  : {formattedTotalSupply} <br/>
    </>
  )
}

export default ReadWagmiEcr20Fields
