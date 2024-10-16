import React from 'react'
import { Address } from 'viem'
import { TokenContract, useErc20TokenContract  } from '@/lib/wagmi/erc20WagmiClientRead'

type Props = {
  TOKEN_CONTRACT_ADDRESS:Address|undefined
}

const ReadWagmiERC20ContractFields = ({ TOKEN_CONTRACT_ADDRESS}: Props) => {
  const tokenContract:TokenContract|undefined = useErc20TokenContract(TOKEN_CONTRACT_ADDRESS)
   return (
    <>
      <hr className="border-top: 3px dashed #bbb"/>
      <h2>Reading Wagmi ERC20 Fields for Token Contract({TOKEN_CONTRACT_ADDRESS})</h2>
      Token Name   : {tokenContract?.name} <br/>
      Symbol       : {tokenContract?.symbol} <br/>
      Decimals     : {tokenContract?.decimals} <br/>
      Total Supply : {tokenContract?.totalSupply?.toString()}
    </>
  )
}

export default ReadWagmiERC20ContractFields
