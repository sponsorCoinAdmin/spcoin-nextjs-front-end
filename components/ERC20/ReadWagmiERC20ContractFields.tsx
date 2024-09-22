import React from 'react'
import { Address } from 'viem'
import { useErc20ClientContract  } from '@/lib/wagmi/erc20WagmiClientRead'

type Props = {
  TOKEN_CONTRACT_ADDRESS:Address
}

const ReadWagmiERC20ContractFields = ({ TOKEN_CONTRACT_ADDRESS}: Props) => {

  const contract    = useErc20ClientContract(TOKEN_CONTRACT_ADDRESS)
  const name        = contract.name
  const symbol      = contract.symbol
  const decimals    = contract.decimals
  const totalSupply = contract.totalSupply
  return (
    <>
      <hr className="border-top: 3px dashed #bbb"/>
      <h2>Reading Wagmi ERC20 Fields for Token Contract({TOKEN_CONTRACT_ADDRESS})</h2>
      Token Name   : {name} <br/>
      Symbol       : {symbol} <br/>
      Decimals     : {decimals} <br/>
      Total Supply : {totalSupply?.toString()}
    </>
  )
}

export default ReadWagmiERC20ContractFields
