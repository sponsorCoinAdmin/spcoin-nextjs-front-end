import React from 'react'
import { Address } from 'viem'
import { getErc20ClientContract  } from '@/lib/wagmi/erc20WagmiClientRead'

type Props = {
  TOKEN_CONTRACT:Address
}

const ReadWagmiEcr20ContractFields = ({ TOKEN_CONTRACT}: Props) => {

  let contract    = getErc20ClientContract(TOKEN_CONTRACT)
  let name        = contract.name
  let symbol      = contract.symbol
  let decimals    = contract.decimals
  let totalSupply = contract.totalSupply
  return (
    <>
      <hr className="border-top: 3px dashed #bbb"/>
      <h2>Reading Wagmi Ecr20 Fields for Token Contract({TOKEN_CONTRACT})</h2>
      Token Name   : {name} <br/>
      Symbol       : {symbol} <br/>
      Decimals     : {decimals} <br/>
      Total Supply : {totalSupply?.toString()}
    </>
  )
}

export default ReadWagmiEcr20ContractFields
