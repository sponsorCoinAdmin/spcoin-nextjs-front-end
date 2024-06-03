import React from 'react'
import { Address } from 'viem'
import { getERC20WagmiClientSymbol  } from '@/lib/wagmi/erc20WagmiClientRead'

type Props = {
  TOKEN_CONTRACT:Address
}

const contractSymbol = ({ TOKEN_CONTRACT}: Props) => {
  let symbol    = getERC20WagmiClientSymbol(TOKEN_CONTRACT)
  return (
    <>
      <hr className="border-top: 3px dashed #bbb"/>
      <h2>Reading Wagmi Token Symbol for Contract({TOKEN_CONTRACT})</h2>
      Token Symbol : {symbol} <br/>
    </>
  )
}

export default contractSymbol
