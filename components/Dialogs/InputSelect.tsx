'use client'

import styles from '@/styles/Modal.module.css'
import React, { useEffect, useState } from 'react'

import { invalidTokenContract } from '@/lib/spCoin/coreUtils'
import searchMagGlassGrey_png from '@/public/assets/miscellaneous/SearchMagGlassGrey.png'
import badTokenAddressImage from '@/public/assets/miscellaneous/badTokenAddressImage.png'
import {
  TokenContract,
  useErc20NetworkContract,
  useErc20TokenContract,
} from '@/lib/wagmi/wagmiERC20ClientRead'
import { Address } from 'viem'
import { useChainId } from 'wagmi'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { isAddress } from 'viem'
import { useMappedTokenContract } from '@/lib/hooks/wagmiERC20hooks'

export enum InputState {
  EMPTY_INPUT = 'EMPTY_INPUT',
  VALID_INPUT = 'VALID_INPUT',
  INVALID_ADDRESS_INPUT = 'INVALID_ADDRESS_INPUT',
  CONTRACT_NOT_FOUND_INPUT = 'CONTRACT_NOT_FOUND_INPUT',
  DUPLICATE_INPUT = 'DUPLICATE_INPUT'
}

type Props = {
  placeHolder: string
  passedInputField: any
  setTokenContractCallBack: (
    tokenContract: TokenContract | undefined,
    state: InputState
  ) => void
  setInputState?: (state: InputState) => void
}

function InputSelect({
  placeHolder,
  passedInputField,
  setTokenContractCallBack,
  setInputState: notifyParent
}: Props) {
  const chainId: number = useChainId()
  const [textInputField, setTextInputField] = useState<any>()
  const [tokenAddress, setTokenAddress] = useState<Address | undefined>()
  const [inputState, setInputStateLocal] = useState<InputState>(InputState.EMPTY_INPUT)
  const tokenContract: TokenContract | undefined = useMappedTokenContract(tokenAddress)

  useEffect(() => {
      if (!tokenContract && tokenAddress) {
        updateInputState(InputState.CONTRACT_NOT_FOUND_INPUT)
      }
  }, [tokenContract]);

  const debouncedInput: string = useDebounce(textInputField)

  const updateInputState = (state: InputState) => {
    setInputStateLocal(state)
    if (notifyParent) notifyParent(state)
  }

  useEffect(() => {
    setTextInputField(passedInputField)
  }, [passedInputField])

  useEffect(() => {
    validateDebouncedInput(debouncedInput)
  }, [debouncedInput])

  // ✅ Always notify parent of latest inputState and tokenContract
  useEffect(() => {
    if(tokenContract)
      setTokenContractCallBack(tokenContract, inputState)
  }, [tokenContract, inputState])

  const validateDebouncedInput = (input: string) => {
    if (!input || typeof input !== 'string') {
      updateInputState(InputState.EMPTY_INPUT)
      return
    }

    let trimmedInput:string = input.trim()

    // trimmedInput ="";
    if (!isAddress(trimmedInput)) {
      updateInputState(InputState.INVALID_ADDRESS_INPUT)
      return
    }

    setTokenAddress(trimmedInput)
    updateInputState(InputState.VALID_INPUT)
  }

  const getInputEmoji = (): string => {
    switch (inputState) {
      case InputState.VALID_INPUT:
        return '✅'
      case InputState.INVALID_ADDRESS_INPUT:
      case InputState.DUPLICATE_INPUT:
        return '❌'
      case InputState.EMPTY_INPUT:
        return '🔍'
      case InputState.CONTRACT_NOT_FOUND_INPUT:
      default:
        return '❓'
    }
  }

  const validateTextInput = (input: string) => {
    const trimmed = input.trim();
  
    // Allow empty input
    if (trimmed === '') {
      setTextInputField(trimmed);
      return;
    }
  
    // Allow progressive hex entry: '0', '0x', or '0x' followed by hex chars
    const isPartialHex = /^0x?[0-9a-fA-F]*$/.test(trimmed);
    if (isPartialHex) {
      setTextInputField(trimmed);
    }
  
    // Reject all others — input will not be set
  };  
  
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
          value={textInputField || ''}
          onChange={(e) => validateTextInput(e.target.value)}
          />
      </div>
    </div>
  )
}

export default InputSelect