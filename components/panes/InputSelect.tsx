'use client'

import React, { useEffect, useState } from "react"

import styles from '@/styles/Modal.module.css'
import { invalidTokenContract } from '@/lib/spCoin/coreUtils'

import searchMagGlassGrey_png from '@/public/assets/miscellaneous/SearchMagGlassGrey.png'
import Image from 'next/image'
import {
  TokenContract,
  useErc20NetworkContract,
  useErc20TokenContract
} from "@/lib/wagmi/wagmiERC20ClientRead"
import { Address } from "viem"
import { useChainId } from "wagmi"
import { useDebounce } from "@/lib/hooks/useDebounce"
import { getTokenAvatar, isActiveAccountAddress } from "@/lib/network/utils"
import { useExchangeContext } from '@/lib/context/contextHooks'
import { isAddress } from 'viem'

type Props = {
  placeHolder: string
  passedInputField: any
  setTokenContractCallBack: (tokenContract: TokenContract | undefined) => void
}

function InputSelect({ placeHolder, passedInputField, setTokenContractCallBack }: Props) {
  const chainId: number = useChainId()
  const [textInputField, setTextInputField] = useState<any>()
  const [validAddress, setValidAddress] = useState<Address | undefined>()
  const [tokenAddress, setTokenAddress] = useState<Address | undefined>()
  const [networkAddress, setNetworkAddress] = useState<Address | undefined>()

  const debouncedText: string = useDebounce(textInputField) // ✅ Debounced input
  const tokenContract: TokenContract | undefined = useErc20TokenContract(tokenAddress)
  const networkContract: TokenContract | undefined = useErc20NetworkContract(networkAddress)

  const { exchangeContext } = useExchangeContext()

  const isActiveNetworkAddress = (address: Address | undefined) => {
    return isActiveAccountAddress(exchangeContext, address)
  }

  useEffect(() => {
    setTextInputField(passedInputField)
  }, [passedInputField])

  useEffect(() => {
    if (tokenContract?.address) {
      getTokenAvatar(tokenContract)
    } else {
      setTokenContractCallBack(tokenContract)
    }
  }, [
    tokenContract?.name,
    tokenContract?.symbol,
    tokenContract?.decimals,
    tokenContract?.totalSupply
  ])

  useEffect(() => {
    if (networkContract?.address) {
      getTokenAvatar(tokenContract)
    } else {
      setTokenContractCallBack(networkContract)
    }
  }, [
    networkContract?.name,
    networkContract?.symbol,
    networkContract?.decimals,
    networkContract?.totalSupply
  ])

  /** ✅ Address validation now uses debounced text */

  useEffect(() => {
    if (!debouncedText || typeof debouncedText !== 'string') {
      setTokenContractCallBack(undefined)
      return
    }
  
    const trimmedInput = debouncedText.trim()
  
    if (!isAddress(trimmedInput)) {
      const invalidToken: TokenContract | undefined = invalidTokenContract(trimmedInput, chainId)
      setTokenContractCallBack(invalidToken)
      return
    }
  
    // Valid address — pass it on
    setContractType(trimmedInput as Address)
  }, [debouncedText])
  

  useEffect(() => {
    if (validAddress) {
      isActiveNetworkAddress(validAddress)
        ? setNetworkAddress(validAddress)
        : setTokenAddress(validAddress)
    }
  }, [validAddress])

  const setContractType = (passedValidAddress: Address | undefined) => {
    if (!isActiveNetworkAddress(validAddress)) {
      if (passedValidAddress === validAddress) {
        setTokenContractCallBack(tokenContract)
      } else {
        setValidAddress(passedValidAddress)
      }
    }
  }

  return (
    <div className={styles.modalElementSelect}>
      <div className={styles.leftH}>
        <Image
          src={searchMagGlassGrey_png}
          className={styles.searchImage}
          alt="Search Image Grey"
        />
        <input
          className={styles.modalElementSelect}
          autoComplete="off"
          placeholder={placeHolder}
          value={textInputField || ""}
          onChange={(e) => setTextInputField(e.target.value)}
        />
      </div>
    </div>
  )
}

export default InputSelect
