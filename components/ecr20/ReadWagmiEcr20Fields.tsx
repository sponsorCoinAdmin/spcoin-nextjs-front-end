import React from 'react'
import { Address } from 'viem'
import {
    useERC20WagmiClientDecimals,
    useERC20WagmiClientName,
    useERC20WagmiClientSymbol,
    useERC20WagmiClientTotalSupply,
    getFormattedClientTotalSupply } from '@/lib/wagmi/erc20WagmiClientRead'

type Props = {
  TOKEN_CONTRACT_ADDRESS:Address
}

const ReadWagmiEcr20Fields = ({ TOKEN_CONTRACT_ADDRESS}: Props) => {
  const name                 = useERC20WagmiClientName(TOKEN_CONTRACT_ADDRESS)
  const symbol               = useERC20WagmiClientSymbol(TOKEN_CONTRACT_ADDRESS)
  const decimals             = useERC20WagmiClientDecimals(TOKEN_CONTRACT_ADDRESS)
  const totalSupply          = useERC20WagmiClientTotalSupply(TOKEN_CONTRACT_ADDRESS)?.toString()
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
