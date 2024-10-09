import React from 'react'
import { Address } from 'viem'
import { useERC20WagmiClientTotalSupply  } from '@/lib/wagmi/erc20WagmiClientRead'

type Props = {
  TOKEN_CONTRACT_ADDRESS:Address|undefined
}

const contractTotalSupply = ({ TOKEN_CONTRACT_ADDRESS}: Props) => {
  const totalSupply    = useERC20WagmiClientTotalSupply(TOKEN_CONTRACT_ADDRESS)
  return (
    <>
      <hr className="border-top: 3px dashed #bbb"/>
      <h2>Reading Wagmi Token TotalSupply for Contract({TOKEN_CONTRACT_ADDRESS})</h2>
      Token TotalSupply   : {totalSupply?.toString()} <br/>
    </>
  )
}

export default contractTotalSupply
