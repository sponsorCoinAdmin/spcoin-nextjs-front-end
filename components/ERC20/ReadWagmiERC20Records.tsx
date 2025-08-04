// File: components/ERC20/ReadWagmiERC20Records.tsx

import React from 'react'
import { Address } from 'viem'
import { useWagmiERC20TokenRecords, formatDecimals } from '@/lib/hooks/wagmi/wagmiERC20ClientRead'

type Props = {
  TOKEN_CONTRACT_ADDRESS: Address | undefined
}

const ReadWagmiERC20Records = ({ TOKEN_CONTRACT_ADDRESS }: Props) => {
  const wagmiRecords = useWagmiERC20TokenRecords(TOKEN_CONTRACT_ADDRESS)
  const nameRec = wagmiRecords.nameRec
  const symbolRec = wagmiRecords.symbolRec
  const decimalRec = wagmiRecords.decimalRec
  const totalSupplyRec = wagmiRecords.totalSupplyRec

  const name = nameRec.status === 'success' ? nameRec.data : null
  const symbol = symbolRec.status === 'success' ? symbolRec.data : null
  const decimalsRaw = decimalRec?.status === 'success' ? decimalRec.data : null
  const totalSupplyRaw = totalSupplyRec.status === 'success' ? totalSupplyRec.data : null

  const decimals = typeof decimalsRaw === 'bigint' ? Number(decimalsRaw) : Number(decimalsRaw ?? NaN)
  const totalSupply = typeof totalSupplyRaw === 'bigint' ? Number(totalSupplyRaw) : Number(totalSupplyRaw ?? NaN)

  const hasFormatted = !isNaN(decimals) && !isNaN(totalSupply)

  return (
    <>
      <hr className="border-top: 3px dashed #bbb" />
      <h2>Read Wagmi ERC20 Record for Token Contract ({TOKEN_CONTRACT_ADDRESS})</h2>
      <div>{name === null ? null : 'Token Name : ' + name}</div>
      <div>{symbol === null ? null : 'Symbol : ' + symbol}</div>
      <div>{isNaN(decimals) ? null : 'Decimals : ' + decimals}</div>
      <div>{isNaN(totalSupply) ? null : 'Total Supply : ' + totalSupply}</div>
      <div>
        {hasFormatted
          ? 'Formatted Total Supply : ' + formatDecimals(totalSupply, decimals)
          : null}
      </div>
    </>
  )
}

export default ReadWagmiERC20Records
