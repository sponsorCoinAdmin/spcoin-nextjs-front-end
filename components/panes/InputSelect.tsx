'use client'

import React, { useEffect, useState } from "react";

import styles from '@/styles/Modal.module.css';
// import searchMagGlassBlack_png from './Resources/images/searchMagGlassBlack.png'
// import searchMagGlassWhite_png from './Resources/images/searchMagGlassWhite.png'
// import searchMagGlassGrey_png from '../../../resources/images/SearchMagGlassGrey.png'
// import searchMagGlassGrey_png from '@/public/resources/images/SearchMagGlassGrey.png'
import { defaultMissingImage, fetchIconResource, getValidAddress, invalidTokenContract, stringifyBigInt } from '@/lib/spCoin/utils';
import searchMagGlassGrey_png from '@/public/resources/images/SearchMagGlassGrey.png'
import Image from 'next/image'
import { TokenContract, useErc20ClientContract } from "@/lib/wagmi/erc20WagmiClientRead";
import { Address } from "viem";
import { useChainId } from "wagmi";

type Props = {
  placeHolder:string,
  passedInputField:any,
  setTokenContractCallBack:(tokenContract:TokenContract|undefined) => void 
}

function InputSelect({ placeHolder, passedInputField, setTokenContractCallBack }:Props) {
  const chainId = useChainId();
  const [ textInputField, setTextInputField ] = useState<any>();
  const [ validAddress, setValidAddress ] = useState<Address>();
  const tokenContract = useErc20ClientContract(validAddress);

  useEffect(() => {
    setTextInputField(passedInputField)
  }, [passedInputField])

  useEffect(() => {
    if (tokenContract.name) {
      // alert(`tokenContract = ${stringifyBigInt(tokenContract)}`)
      fetchIconResource(tokenContract, setTokenContractCallBack)
    }
  }, [tokenContract.name, tokenContract.symbol, tokenContract.decimals, tokenContract.totalSupply])

  useEffect(() => {
    const validAddress = getValidAddress(textInputField);
    setValidAddress(validAddress)
    if (!validAddress) {
      const invalidToken:TokenContract|undefined = invalidTokenContract(textInputField, chainId)
      setTokenContractCallBack(invalidToken);
    }
  }, [textInputField])

  return (
    <div className={styles.modalElementSelect}>
      <div className={styles.leftH}>
        <Image src={searchMagGlassGrey_png} className={styles.searchImage} alt="Search Image Grey" />
        <input className={styles.modalElementSelect} 
               autoComplete="off" 
               placeholder={placeHolder} 
               value={textInputField} 
               onChange={(e) => setTextInputField(e.target.value) }/>
      </div>
    </div>
  );
}

export default InputSelect;
