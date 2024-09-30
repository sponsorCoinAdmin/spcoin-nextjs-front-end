'use client'

import React from "react";

import styles from '@/styles/Modal.module.css';
// import searchMagGlassBlack_png from './Resources/images/searchMagGlassBlack.png'
// import searchMagGlassWhite_png from './Resources/images/searchMagGlassWhite.png'
// import searchMagGlassGrey_png from '../../../resources/images/SearchMagGlassGrey.png'
// import searchMagGlassGrey_png from '@/public/resources/images/SearchMagGlassGrey.png'
import searchMagGlassGrey_png from '@/public/resources/images/SearchMagGlassGrey.png'
import Image from 'next/image'
import { Address } from "viem";
// import ConnectButton from "./ConnectButton";

type Props = {
  placeHolder:string,
  textInputField:Address|undefined,
  setTokenInput:(event:any) => void 
}

function InputSelect({ placeHolder, textInputField, setTokenInput }:Props) {

  const setTokenInputField = (event:any) => {
    setTokenInput(event.target.value)
  }

  return (
    <div className={styles.modalElementSelect}>
      <div className={styles.leftH}>
        <Image src={searchMagGlassGrey_png} className={styles.searchImage} alt="Search Image Grey" />
        <input className={styles.modalElementSelect} autoComplete="off" placeholder={placeHolder} value={textInputField} onChange={setTokenInputField}/>
      </div>
    </div>
  );
}

export default InputSelect;
