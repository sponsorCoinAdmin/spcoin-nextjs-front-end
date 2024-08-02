import React from 'react'
import { Address } from 'viem'
import { getErc20ClientContract  } from '@/lib/wagmi/erc20WagmiClientRead'

type Props = {
  TOKEN_CONTRACT:Address
}

const ReadWagmiEcr20ContractFields = ({ TOKEN_CONTRACT}: Props) => {

  const contract    = getErc20ClientContract(TOKEN_CONTRACT)
  const name        = contract.name
  const symbol      = contract.symbol
  const decimals    = contract.decimals
  const totalSupply = contract.totalSupply
  return (
    <>
      <hr className="border-top: 3px dashed #bbb"/>
      <h2>Reading Wagmi ERC20 Fields for Token Contract({TOKEN_CONTRACT})</h2>
      Token Name   : {name} <br/>
      Symbol       : {symbol} <br/>
      Decimals     : {decimals} <br/>
      Total Supply : {totalSupply?.toString()}
    </>
  )
}

export default ReadWagmiEcr20ContractFields
