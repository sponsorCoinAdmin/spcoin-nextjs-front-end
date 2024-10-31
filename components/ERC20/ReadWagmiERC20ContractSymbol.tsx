import React from 'react'
import { Address } from 'viem'
import { useWagmiERC20TokenSymbol  } from '@/lib/wagmi/wagmiERC20ClientRead'

type Props = {
  TOKEN_CONTRACT_ADDRESS:Address|undefined
}

const contractSymbol = ({ TOKEN_CONTRACT_ADDRESS}: Props) => {
  const symbol    = useWagmiERC20TokenSymbol(TOKEN_CONTRACT_ADDRESS)
  return (
    <>
      <hr className="border-top: 3px dashed #bbb"/>
      <h2>Reading Wagmi Token Symbol for Contract({TOKEN_CONTRACT_ADDRESS})</h2>
      Token Symbol : {symbol} <br/>
    </>
  )
}

export default contractSymbol
