import React from 'react'
import { Address } from 'viem'
import { useERC20WagmiTokenDecimals  } from '@/lib/wagmi/wagmiERC20ClientRead'

type Props = {
  TOKEN_CONTRACT_ADDRESS:Address|undefined
}

const contractDecimals = ({ TOKEN_CONTRACT_ADDRESS}: Props) => {
  const decimals    = useERC20WagmiTokenDecimals(TOKEN_CONTRACT_ADDRESS)
  return (
    <>
      <hr className="border-top: 3px dashed #bbb"/>
      <h2>Reading Wagmi Token Decimals for Contract({TOKEN_CONTRACT_ADDRESS})</h2>
      Token Decimals : {decimals} <br/>
    </>
  )
}

export default contractDecimals
