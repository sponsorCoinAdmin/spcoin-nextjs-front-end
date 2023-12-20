'use client'

import React from "react";

import styles from './Styles/Modal.module.css';
// import searchMagGlassBlack_png from './Resources/images/searchMagGlassBlack.png'
// import searchMagGlassWhite_png from './Resources/images/searchMagGlassWhite.png'
import searchMagGlassGrey_png from './Resources/images/searchMagGlassGrey.png'
import Image from 'next/image'
// import ConnectButton from "./ConnectButton";

function InputSelect({selectElement}:any) {
  // alert("selectElement " + selectElement)

  return (
    <div>
      <div className={styles.leftH}>
        <Image src={searchMagGlassGrey_png} className={styles.searchImage} alt="Search Image Grey" />
        <input className={styles.modalInputSelect} placeholder={selectElement} />
      </div>
    </div>
  );
}

export default InputSelect;
