'use client'

import styles from '@/styles/Modal.module.css'
import React, { useEffect, useState } from "react"

import { invalidTokenContract } from '@/lib/spCoin/coreUtils'
import searchMagGlassGrey_png from '@/public/assets/miscellaneous/SearchMagGlassGrey.png'
import badTokenAddressImage from '@/public/assets/miscellaneous/badTokenAddressImage.png'
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

export enum InputState {
  EMPTY_INPUT = 'EMPTY_INPUT',
  VALID_INPUT = 'VALID_INPUT',
  BAD_ADDRESS_INPUT = 'BAD_ADDRESS_INPUT',
  TOKEN_NOT_FOUND_INPUT = 'TOKEN_NOT_FOUND_INPUT',
}

type Props = {
  placeHolder: string
  passedInputField: any
  setTokenContractCallBack: (tokenContract: TokenContract | undefined, state: InputState) => void
}

function InputSelect({ placeHolder, passedInputField, setTokenContractCallBack }: Props) {
  const chainId: number = useChainId()
  const [textInputField, setTextInputField] = useState<any>()
  const [validAddress, setValidAddress] = useState<Address | undefined>()
  const [tokenAddress, setTokenAddress] = useState<Address | undefined>()
  const [networkAddress, setNetworkAddress] = useState<Address | undefined>()
  const [inputState, setInputState] = useState<InputState>(InputState.EMPTY_INPUT)
  const networkContract: TokenContract | undefined = useErc20NetworkContract(networkAddress)
  const { exchangeContext } = useExchangeContext()

  const debouncedInput: string = useDebounce(textInputField)
  const tokenContract: TokenContract | undefined = useErc20TokenContract(tokenAddress)
  const isActiveNetworkAddress = (address: Address | undefined) => {
    return isActiveAccountAddress(exchangeContext, address)
  }

  useEffect(() => {
    setTextInputField(passedInputField)
  }, [passedInputField])

  useEffect(() => {
    if (networkContract?.address) {
      getTokenAvatar(networkContract)
    } else {
      setTokenContractCallBack(networkContract, InputState.TOKEN_NOT_FOUND_INPUT)
      setInputState(InputState.TOKEN_NOT_FOUND_INPUT)
    }
  }, [
    networkContract?.name,
    networkContract?.symbol,
    networkContract?.decimals,
    networkContract?.totalSupply
  ])

  useEffect(() => {
    validateDebouncedInput(debouncedInput)
  }, [debouncedInput])

  useEffect(() => {
    if (validAddress) {
      isActiveNetworkAddress(validAddress)
        ? setNetworkAddress(validAddress)
        : setTokenAddress(validAddress)
    }
  }, [validAddress])

  // ✅ This effect waits for tokenContract to resolve and match validAddress
  useEffect(() => {
    if (validAddress && tokenContract?.address === validAddress) {
      setTokenContractCallBack(tokenContract, InputState.VALID_INPUT)
      setInputState(InputState.VALID_INPUT)
    }
  }, [tokenContract, validAddress])

  const setContractType = (passedValidAddress: Address | undefined) => {
    if (!isActiveNetworkAddress(validAddress)) {
      if (passedValidAddress !== validAddress) {
        setValidAddress(passedValidAddress)
      }
      // We wait to fire the callback until tokenContract resolves in the effect above
    }
  }

  const validateDebouncedInput = (input: string) => {
    if (!input || typeof input !== 'string') {
      setTokenContractCallBack(undefined, InputState.EMPTY_INPUT)
      setInputState(InputState.EMPTY_INPUT)
      return
    }

    const trimmedInput = input.trim()

    if (!isAddress(trimmedInput)) {
      const invalidToken: TokenContract | undefined = invalidTokenContract(trimmedInput, chainId)
      setTokenContractCallBack(invalidToken, InputState.BAD_ADDRESS_INPUT)
      setInputState(InputState.BAD_ADDRESS_INPUT)
      return
    }

    setContractType(trimmedInput as Address)
  }

  const getInputEmoji = (): string => {
    switch (inputState) {
      case InputState.VALID_INPUT:
        return '✅'
      case InputState.BAD_ADDRESS_INPUT:
        return '🐞'
      case InputState.EMPTY_INPUT:
        return '🔍'
      case InputState.TOKEN_NOT_FOUND_INPUT:
      default:
        return '🕵️'
    }
  }

  return (
    <div className={styles.modalElementSelect}>
      <div className={styles.leftH}>
        <div className={styles.searchImage} style={{ fontSize: '1.2rem' }}>
          {getInputEmoji()}
        </div>
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
