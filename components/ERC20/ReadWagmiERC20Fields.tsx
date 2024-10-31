import React from 'react'
import { Address } from 'viem'
import {
    useERC20WagmiTokenDecimals,
    useERC20WagmiTokenName,
    useERC20WagmiTokenSymbol,
    useERC20WagmiTokenTotalSupply,
    useFormattedClientTotalSupply } from '@/lib/wagmi/wagmiERC20ClientRead'

type Props = {
  TOKEN_CONTRACT_ADDRESS:Address|undefined
}

const ReadWagmiERC20Fields = ({ TOKEN_CONTRACT_ADDRESS}: Props) => {
  const name                 = useERC20WagmiTokenName(TOKEN_CONTRACT_ADDRESS)
  const symbol               = useERC20WagmiTokenSymbol(TOKEN_CONTRACT_ADDRESS)
  const decimals             = useERC20WagmiTokenDecimals(TOKEN_CONTRACT_ADDRESS)
  const totalSupply          = useERC20WagmiTokenTotalSupply(TOKEN_CONTRACT_ADDRESS)?.toString()
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
