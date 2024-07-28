import React from 'react'
import { Address } from 'viem'
import { getERC20WagmiClientRecords, formatDecimals } from '@/lib/wagmi/erc20WagmiClientRead'

type Props = {
  TOKEN_CONTRACT:Address
}

const ReadWagmiEcr20Records = ({ TOKEN_CONTRACT}: Props) => {
  const wagmiRecords = getERC20WagmiClientRecords(TOKEN_CONTRACT)
  const nameRec = wagmiRecords.nameRec
  const symbolRec = wagmiRecords.symbolRec
  const decimalRec = wagmiRecords.decimalRec
  const totalSupplyRec = wagmiRecords.totalSupplyRec

  let name = nameRec.status === 'success' ? nameRec.data : null
  let symbol = symbolRec.status === 'success' ?  symbolRec.data : null
  let decimals = decimalRec?.status === 'success' ? decimalRec?.data : null
  let totalSupply = totalSupplyRec.status === 'success' ? totalSupplyRec.data : null

  return (
    <>
      <hr className="border-top: 3px dashed #bbb"/>
      <h2>Read Wagmi ERC20 Record for Token Contract({TOKEN_CONTRACT})</h2>
      <div>{name === null ? null : "Token Name : " + name }</div>
      <div>{symbol === null ? null : "Symbol : " + symbol }</div>
      <div>{decimals === null ? null : "Decimals : " + decimals }</div>
      <div>{totalSupply === null ? null : "Total Supply : " + totalSupply }</div>
      <div>{(totalSupply === null || decimals === null) ? null : "Formatted Total Supply : " + formatDecimals(totalSupplyRec?.data, decimalRec?.data) }</div>
    </>
  )
}

export default ReadWagmiEcr20Records
