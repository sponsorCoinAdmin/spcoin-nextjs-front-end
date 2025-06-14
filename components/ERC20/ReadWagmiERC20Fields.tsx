import React from 'react'
import { Address } from 'viem'
import {
    useWagmiERC20TokenDecimals,
    useWagmiERC20TokenName,
    useWagmiERC20TokenSymbol,
    useWagmiERC20TokenTotalSupply,
    useFormattedClientTotalSupply } from '@/lib/hooks/wagmi/wagmiERC20ClientRead'

type Props = {
  TOKEN_CONTRACT_ADDRESS:Address|undefined
}

const ReadWagmiERC20Fields = ({ TOKEN_CONTRACT_ADDRESS}: Props) => {
  const name                 = useWagmiERC20TokenName(TOKEN_CONTRACT_ADDRESS)
  const symbol               = useWagmiERC20TokenSymbol(TOKEN_CONTRACT_ADDRESS)
  const decimals             = useWagmiERC20TokenDecimals(TOKEN_CONTRACT_ADDRESS)
  const totalSupply          = useWagmiERC20TokenTotalSupply(TOKEN_CONTRACT_ADDRESS)?.toString()
  const formattedTotalSupply = useFormattedClientTotalSupply(TOKEN_CONTRACT_ADDRESS)
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

export default ReadWagmiERC20Fields
