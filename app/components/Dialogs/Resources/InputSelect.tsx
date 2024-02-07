'use client'

import React from "react";

import styles from './styles/Modal.module.css';
// import searchMagGlassBlack_png from './Resources/images/searchMagGlassBlack.png'
// import searchMagGlassWhite_png from './Resources/images/searchMagGlassWhite.png'
// import searchMagGlassGrey_png from '../../../resources/images/SearchMagGlassGrey.png'
import searchMagGlassGrey_png from '../../../../public/resources/images/SearchMagGlassGrey.png'
import Image from 'next/image'
// import ConnectButton from "./ConnectButton";

function InputSelect({selectElement}:any) {
  // alert("selectElement " + selectElement)

  return (
    <div>
      <div className={styles.leftH}>
        <Image src={searchMagGlassGrey_png} className={styles.searchImage} alt="Search Image Grey" />
        <input className={styles.modalTokenSelect}  autoComplete="off" placeholder={selectElement} />
      </div>
    </div>
  );
}

export default InputSelect;
