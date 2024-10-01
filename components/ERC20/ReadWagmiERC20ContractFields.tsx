import React from 'react'
import { Address } from 'viem'
import { TokenContract, useErc20ClientContract  } from '@/lib/wagmi/erc20WagmiClientRead'

type Props = {
  TOKEN_CONTRACT_ADDRESS:Address|undefined
}

const ReadWagmiERC20ContractFields = ({ TOKEN_CONTRACT_ADDRESS}: Props) => {
  const contract:TokenContract = useErc20ClientContract(TOKEN_CONTRACT_ADDRESS)
   return (
    <>
      <hr className="border-top: 3px dashed #bbb"/>
      <h2>Reading Wagmi ERC20 Fields for Token Contract({TOKEN_CONTRACT_ADDRESS})</h2>
      Token Name   : {contract.name} <br/>
      Symbol       : {contract.symbol} <br/>
      Decimals     : {contract.decimals} <br/>
      Total Supply : {contract.totalSupply?.toString()}
    </>
  )
}

export default ReadWagmiERC20ContractFields
