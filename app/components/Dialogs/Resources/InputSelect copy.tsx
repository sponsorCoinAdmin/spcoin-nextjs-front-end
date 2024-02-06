'use client'

import React from "react";

import styles from './styles/Modal.module.css';
// import searchMagGlassBlack_png from './Resources/images/searchMagGlassBlack.png'
// import searchMagGlassWhite_png from './Resources/images/searchMagGlassWhite.png'
// import searchMagGlassGrey_png from '../../../resources/images/SearchMagGlassGrey.png'
import searchMagGlassGrey_png from '../../../../public/resources/images/SearchMagGlassGrey.png'
import Image from 'next/image'
let el:any;
// import ConnectButton from "./ConnectButton";

function handleChange(event:any) {
  alert(event.target.value);
}
const showHideToken = (event:any) => {
  alert("GGGGGG");
  alert(event.target.value)
  let inputText = event.target.value !== null ? event.target.value : "";
  let showElement = inputText === "" ? false : true;
  if (el != null) {
      el.style.display = showElement ? 'block' : 'none'
  }
}


function InputSelect({selectElement, tokenSelect}:any) {
  // alert("selectElement " + selectElement)
  let el = tokenSelect;
  return (
    <div>
      <div className={styles.leftH}>
        <Image src={searchMagGlassGrey_png} className={styles.searchImage} alt="Search Image Grey" />
        <input className={styles.modalInputSelect} autoComplete="off" placeholder={selectElement} onChange={handleChange}/>
        <input name="firstName" onChange={handleChange} />
      </div>
    </div>
  );
}

export default InputSelect;
