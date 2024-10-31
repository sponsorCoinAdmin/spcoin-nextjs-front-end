import React from 'react'
import { Address } from 'viem'
import {
  formatDecimals,
  useWagmiERC20TokenDecimalRec,
  useWagmiERC20TokenNameRec,
  useWagmiERC20TokenSymbolRec,
  useWagmiERC20TokenTotalSupplyRec } from '@/lib/wagmi/wagmiERC20ClientRead'

type Props = {
  TOKEN_CONTRACT_ADDRESS:Address|undefined
}

const ReadWagmiERC20RecordFields = ( { TOKEN_CONTRACT_ADDRESS }: Props) => {
  const nameRec = useWagmiERC20TokenNameRec(TOKEN_CONTRACT_ADDRESS)
  const symbolRec = useWagmiERC20TokenSymbolRec(TOKEN_CONTRACT_ADDRESS)
  const decimalRec = useWagmiERC20TokenDecimalRec(TOKEN_CONTRACT_ADDRESS)
  const totalSupplyRec = useWagmiERC20TokenTotalSupplyRec(TOKEN_CONTRACT_ADDRESS)

  let name = nameRec.status === 'success' ? nameRec.data : `ERROR name: ${nameRec.status}`
  let symbol = symbolRec.status === 'success' ?  symbolRec.data : `ERROR: ${symbolRec.status}`
  let decimals = decimalRec?.status === 'success' ? decimalRec?.data : `ERROR decimals: ${decimalRec.status}`
  let totalSupply = totalSupplyRec.status === 'success' ? totalSupplyRec.data : `ERROR totalSupply: ${totalSupplyRec.status}`

  return (
    <>
      <hr className="border-top: 3px dashed #bbb"/>
      <h2>Read Wagmi ERC20 Record Fields for Token Contract({TOKEN_CONTRACT_ADDRESS})</h2>
      <div>{name === null ? null : "Token Name : " + name }</div>
      <div>{symbol === null ? null : "Symbol : " + symbol }</div>
      <div>{decimals === null ? null : "Decimals : " + decimals }</div>
      <div>{totalSupply === null ? null : "Total Supply : " + totalSupply }</div>
      <div>{(totalSupply === null || decimals === null) ? null : "Formatted Total Supply : " + formatDecimals(totalSupplyRec?.data, decimalRec?.data) }</div>
    </>
  )
}

export default ReadWagmiERC20RecordFields
