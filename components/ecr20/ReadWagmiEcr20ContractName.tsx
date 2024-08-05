import React from 'react'
import { Address } from 'viem'
import { useERC20WagmiClientName  } from '@/lib/wagmi/erc20WagmiClientRead'

type Props = {
  TOKEN_CONTRACT_ADDRESS:Address
}

const ReadWagmiEcr20ContractName = ({ TOKEN_CONTRACT}: Props) => {
  const name    = useERC20WagmiClientName(TOKEN_CONTRACT)
  return (
    <>
      <hr className="border-top: 3px dashed #bbb"/>
      <h2>Reading Wagmi Token Name for Contract({TOKEN_CONTRACT})</h2>
      Token Name : {name} <br/>
    </>
  )
}

export default ReadWagmiEcr20ContractName
