import React from 'react'
import { Address } from 'viem'
import { useWagmiERC20TokenRecords, formatDecimals } from '@/lib/wagmi/wagmiERC20ClientRead'

type Props = {
  TOKEN_CONTRACT_ADDRESS:Address|undefined
}

const ReadWagmiERC20Records = ({ TOKEN_CONTRACT_ADDRESS}: Props) => {
  const wagmiRecords = useWagmiERC20TokenRecords(TOKEN_CONTRACT_ADDRESS)
  const nameRec = wagmiRecords.nameRec
  const symbolRec = wagmiRecords.symbolRec
  const decimalRec = wagmiRecords.decimalRec
  const totalSupplyRec = wagmiRecords.totalSupplyRec

  const name = nameRec.status === 'success' ? nameRec.data : null
  const symbol = symbolRec.status === 'success' ?  symbolRec.data : null
  const decimals = decimalRec?.status === 'success' ? decimalRec?.data : null
  const totalSupply = totalSupplyRec.status === 'success' ? totalSupplyRec.data : null

  return (
    <>
      <hr className="border-top: 3px dashed #bbb"/>
      <h2>Read Wagmi ERC20 Record for Token Contract({TOKEN_CONTRACT_ADDRESS})</h2>
      <div>{name === null ? null : "Token Name : " + name }</div>
      <div>{symbol === null ? null : "Symbol : " + symbol }</div>
      <div>{decimals === null ? null : "Decimals : " + decimals }</div>
      <div>{totalSupply === null ? null : "Total Supply : " + totalSupply }</div>
      <div>{(totalSupply === null || decimals === null) ? null : "Formatted Total Supply : " + formatDecimals(totalSupplyRec?.data, decimalRec?.data) }</div>
    </>
  )
}

export default ReadWagmiERC20Records
