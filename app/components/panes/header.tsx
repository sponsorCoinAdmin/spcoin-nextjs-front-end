'use client'

import React, { useState } from "react";
import styles from "../../styles/Header.module.css"
import spCoin_png from '../../../public/resources/images/spCoin.png'
import Image from 'next/image'
import Link from 'next/link'
import ConnectButton from "./ConnectButton"
import { getNetworkName, getAvatarImageURL } from "@/app/lib/network/utils";

import { useChainId } from "wagmi";

export default () => {
  let chainId = useChainId();
  let AAA = getNetworkName(chainId)
  const [networkName, setNetworkName] = useState<>(chainId);

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
          <img src={getAvatarImageURL(chainId)} alt={'??'} width={20} height={20} className={styles.elementLogo}/>
          {/* &nbsp;&nbsp;{getNetworkName(chainId)} */}
          {/* {"GGG"} */}
          &nbsp;&nbsp;{networkName}
        </div>
        <ConnectButton />
      </div>
    </header>
  );
}