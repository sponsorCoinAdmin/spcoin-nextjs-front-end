'use server'

import React from "react";
import styles from "../../styles/App.module.css";

import spCoin_png from '../images/spCoin.png'
import eth_png from '../images/eth.png'
import Image from 'next/image'

import Link from 'next/link'

function Header(props: { address: any; isConnected: any; connect: any; }) {
  const {address, isConnected, connect} = props;

  return (
    <header>
      <div className={styles.leftH}>
        <Image src={spCoin_png} width={25} height={25} alt="Sponsor Coin Logo" />
        <div className={styles.headerItem}><Link href="/Swap">Swap</Link></div>
        <div className={styles.headerItem}><Link href="/Recipients">Recipients</Link></div>
        <div className={styles.headerItem}><Link href="/Agents">Agents</Link></div>
        <div className={styles.headerItem}><Link href="/Tokens">Tokens</Link></div>
      </div>
      <div className={styles.rightH}>
        <div className={styles.headerItem}>
        <Image src={eth_png} width={25} height={25} alt="Sponsor Coin Logo" />
        &nbsp;&nbsp;Ethereum
        </div>
        <div className={styles.connectButton} onClick={connect}>
          {isConnected ? (address.slice(0,4) +"..." +address.slice(38)) : "Connect"}
        </div>
      </div>
    </header>
  );
}

export default Header;
