'use client'

import React from "react";
import styles from "../../styles/Header.module.css"
import spCoin_png from '../../../public/resources/images/spCoin.png'
import Image from 'next/image'
import Link from 'next/link'
import ConnectButton from "./ConnectButton"
import { getNetworkName } from "@/app/lib/network/utils";

import { useChainId } from "wagmi";

const imgHome = "/resources/images/chains/"
const imgOptions = ".png"

export default () => {
  function getTokenImageURL(chainId:number|string) {
    let imgURL:string = imgHome+chainId + imgOptions;
    return imgURL
  }

  return (
    <header>
      <div className={styles.leftH}>
        <Image className={styles.imgOptions} src={spCoin_png} width={25} height={25} alt="Sponsor Coin Logo" />
        <div className={styles.headerItem}><Link href="/SponsorCoin">SponsorCoin</Link></div>
        <div className={styles.headerItem}><Link href="/Exchange">Exchange</Link></div>
        <div className={styles.headerItem}><Link href="/Admin">Admin</Link></div>
        <div className={styles.headerItem}><Link href="/Recipient"></Link></div>
        {/* <div className={styles.headerItem}><Link href="/0X">0X</Link></div> */}
      </div>
      <div className={styles.rightH}>
        <div className={styles.headerItem}>
          <img src={getTokenImageURL(useChainId())} alt={'??'} width={20} height={20} className={styles.elementLogo} />
            &nbsp;&nbsp;{getNetworkName(useChainId())}
        </div>
        <ConnectButton />
      </div>
    </header>
  );
}