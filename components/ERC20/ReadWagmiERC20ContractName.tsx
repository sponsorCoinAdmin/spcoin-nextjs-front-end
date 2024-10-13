import React from 'react'
import { Address } from 'viem'
import { useERC20WagmiTokenName  } from '@/lib/wagmi/erc20WagmiClientRead'

type Props = {
  TOKEN_CONTRACT_ADDRESS:Address|undefined
}

const ReadWagmiERC20ContractName = ({ TOKEN_CONTRACT_ADDRESS}: Props) => {
  const name    = useERC20WagmiTokenName(TOKEN_CONTRACT_ADDRESS)
  return (
    <>
      <hr className="border-top: 3px dashed #bbb"/>
      <h2>Reading Wagmi Token Name for Contract({TOKEN_CONTRACT_ADDRESS})</h2>
      Token Name : {name} <br/>
    </>
  )
}

export default ReadWagmiERC20ContractName
