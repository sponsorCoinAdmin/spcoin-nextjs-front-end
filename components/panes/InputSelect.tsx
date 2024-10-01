'use client'

import React, { useEffect, useState } from "react";

import styles from '@/styles/Modal.module.css';
// import searchMagGlassBlack_png from './Resources/images/searchMagGlassBlack.png'
// import searchMagGlassWhite_png from './Resources/images/searchMagGlassWhite.png'
// import searchMagGlassGrey_png from '../../../resources/images/SearchMagGlassGrey.png'
// import searchMagGlassGrey_png from '@/public/resources/images/SearchMagGlassGrey.png'
import searchMagGlassGrey_png from '@/public/resources/images/SearchMagGlassGrey.png'
import Image from 'next/image'
import { TokenContract } from '@/lib/structure/types';
import { Address } from "viem";
import { useErc20ClientContract } from "@/lib/wagmi/erc20WagmiClientRead";
// import ConnectButton from "./ConnectButton";

type Props = {
  placeHolder:string,
  textInputField:Address|undefined,
  setTokenContractCallBack:(tokenContract:TokenContract) => void 
}

function InputSelect({ placeHolder, textInputField, setTokenContractCallBack }:Props) {
  const [ inputField, setInputField ] = useState<Address|undefined>(textInputField);
  const tokenContract = useErc20ClientContract(inputField)
 
  useEffect(() => {
    // alert(`InputSelect.useEffect.[tokenContract]`)
    setTokenContractCallBack(tokenContract)
  }, [tokenContract])
  
  const setTokenInputField = (event:any) => {
    setInputField(event.target.value)
  }

  return (
    <div className={styles.modalElementSelect}>
      <div className={styles.leftH}>
        <Image src={searchMagGlassGrey_png} className={styles.searchImage} alt="Search Image Grey" />
        <input className={styles.modalElementSelect} autoComplete="off" placeholder={placeHolder} value={inputField} onChange={setTokenInputField}/>
      </div>
    </div>
  );
}

export default InputSelect;
