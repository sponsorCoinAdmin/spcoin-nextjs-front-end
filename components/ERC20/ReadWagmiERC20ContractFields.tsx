import React from 'react'
import type { Address } from 'viem'
import type { TokenContract} from '@/lib/hooks/wagmi/wagmiERC20ClientRead';
import { useErc20TokenContract  } from '@/lib/hooks/wagmi/wagmiERC20ClientRead'

type Props = {
  TOKEN_CONTRACT_ADDRESS:Address|undefined
}

const ReadWagmiERC20ContractFields = ({ TOKEN_CONTRACT_ADDRESS}: Props) => {
  const tokenContract:TokenContract|undefined = useErc20TokenContract(TOKEN_CONTRACT_ADDRESS)
   return (
    <>
      <hr className="border-top: 3px dashed #bbb"/>
      <h2>Reading Wagmi ERC20 Fields for PREVIEW_CONTRACT({TOKEN_CONTRACT_ADDRESS})</h2>
      Token Name   : {tokenContract?.name} <br/>
      Symbol       : {tokenContract?.symbol} <br/>
      Decimals     : {tokenContract?.decimals} <br/>
      Total Supply : {tokenContract?.totalSupply?.toString()}
    </>
  )
}

export default ReadWagmiERC20ContractFields
