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
import { useMappedTokenContract } from '@/lib/hooks/wagmiERC20hooks'

export enum InputState {
  EMPTY_INPUT = 'EMPTY_INPUT',
  VALID_INPUT = 'VALID_INPUT',
  BAD_ADDRESS_INPUT = 'BAD_ADDRESS_INPUT',
  CONTRACT_NOT_FOUND_INPUT = 'CONTRACT_NOT_FOUND_INPUT',
}

type Props = {
  placeHolder: string
  passedInputField: any
  inputState: InputState
  setInputState: (state: InputState) => void
  setTokenContractCallBack: (tokenContract: TokenContract | undefined, state: InputState) => void
}

function InputSelect({ placeHolder, passedInputField, inputState, setInputState, setTokenContractCallBack }: Props) {
  const chainId: number = useChainId()
  const [textInputField, setTextInputField] = useState<any>()
  const [tokenAddress, setTokenAddress] = useState<Address | undefined>()
  const tokenContract: TokenContract|undefined  = useMappedTokenContract(tokenAddress)
  const { exchangeContext } = useExchangeContext()

  const debouncedInput: string = useDebounce(textInputField)

  useEffect(() => {
    setTextInputField(passedInputField)
  }, [passedInputField])

  useEffect(() => {
    validateDebouncedInput(debouncedInput)
  }, [debouncedInput])

  useEffect(() => {
    setTokenContractCallBack(
      tokenContract,
      tokenContract ? InputState.VALID_INPUT : InputState.CONTRACT_NOT_FOUND_INPUT
    )
  }, [tokenContract])

  const validateDebouncedInput = (input: string) => {
    console.log(`🔍 validateDebouncedInput called with: ${input}\n`);
    if (!input || typeof input !== 'string') {
      setTokenContractCallBack(undefined, InputState.EMPTY_INPUT)
      console.log(`🔍 🎯 inputState set to: ${InputState.EMPTY_INPUT}`)
      return
    }

    const trimmedInput = input.trim()

    if (!isAddress(trimmedInput)) {
      const invalidToken: TokenContract | undefined = invalidTokenContract(trimmedInput, chainId)
      setTokenContractCallBack(invalidToken, InputState.BAD_ADDRESS_INPUT)
      console.log(`🔍 🎯 inputState set to: ${InputState.BAD_ADDRESS_INPUT}`)
      return
    }

    setTokenAddress(trimmedInput)

    setInputState(InputState.VALID_INPUT)
  }

  const getInputEmoji = (): string => {
    switch (inputState) {
      case InputState.VALID_INPUT:
        return '✅'
      case InputState.BAD_ADDRESS_INPUT:
        return '🐞'
      case InputState.EMPTY_INPUT:
        return '🔍'
      case InputState.CONTRACT_NOT_FOUND_INPUT:
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
