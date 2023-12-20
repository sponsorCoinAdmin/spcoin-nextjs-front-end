'use client'

import React from "react";
import styles from "../../styles/Header.module.css"
import spCoin_png from '../images/spCoin.png'
import eth_png from '../images/eth.png'
import Image from 'next/image'
import Link from 'next/link'
import ConnectButton from "./ConnectButton";

function Header() {
  return (
    <header>
      <div className={styles.leftH}>
        <Image src={spCoin_png} width={25} height={25} alt="Sponsor Coin Logo" />
        <div className={styles.headerItem}><Link href="/Recipients">Recipients</Link></div>
        <div className={styles.headerItem}><Link href="/Agents">Agents</Link></div>
        <div className={styles.headerItem}><Link href="/Tokens">Tokens</Link></div>
        <div className={styles.headerItem}><Link href="/SpCoin">SpCoin</Link></div>
        <div className={styles.headerItem}><Link href="/Moralis">Moralis</Link></div>
        {/* <div className={styles.headerItem}><Link href="/0X">0X</Link></div> */}
      </div>
      <div className={styles.rightH}>
        <div className={styles.headerItem}>
          <Image src={eth_png} width={25} height={25} alt="Ethereum Logo" />
          &nbsp;&nbsp;Ethereum
        </div>
        <ConnectButton />

        {/* {<ConnectButton />} */}
      </div>
    </header>
  );
}

export default Header;
