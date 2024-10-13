import React from 'react'
import { Address } from 'viem'
import {
  formatDecimals,
  useERC20WagmiTokenDecimalRec,
  useERC20WagmiTokenNameRec,
  useERC20WagmiTokenSymbolRec,
  useERC20WagmiTokenTotalSupplyRec } from '@/lib/wagmi/erc20WagmiClientRead'

type Props = {
  TOKEN_CONTRACT_ADDRESS:Address|undefined
}

const ReadWagmiERC20RecordFields = ( { TOKEN_CONTRACT_ADDRESS }: Props) => {
  const nameRec = useERC20WagmiTokenNameRec(TOKEN_CONTRACT_ADDRESS)
  const symbolRec = useERC20WagmiTokenSymbolRec(TOKEN_CONTRACT_ADDRESS)
  const decimalRec = useERC20WagmiTokenDecimalRec(TOKEN_CONTRACT_ADDRESS)
  const totalSupplyRec = useERC20WagmiTokenTotalSupplyRec(TOKEN_CONTRACT_ADDRESS)

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
