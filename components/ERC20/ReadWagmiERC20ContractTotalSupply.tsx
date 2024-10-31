import React from 'react'
import { Address } from 'viem'
import { useWagmiERC20TokenTotalSupply  } from '@/lib/wagmi/wagmiERC20ClientRead'

type Props = {
  TOKEN_CONTRACT_ADDRESS:Address|undefined
}

const contractTotalSupply = ({ TOKEN_CONTRACT_ADDRESS}: Props) => {
  const totalSupply    = useWagmiERC20TokenTotalSupply(TOKEN_CONTRACT_ADDRESS)
  return (
    <>
      <hr className="border-top: 3px dashed #bbb"/>
      <h2>Reading Wagmi Token TotalSupply for Contract({TOKEN_CONTRACT_ADDRESS})</h2>
      Token TotalSupply   : {totalSupply?.toString()} <br/>
    </>
  )
}

export default contractTotalSupply
