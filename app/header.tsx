import React from "react";
import styles from "../styles/App.module.css";

import Image1 from './spCoin.png'
import Image from 'next/image'

// import Eth from "./eth.svg";
import Agents from "./components/Agents";
import Recipients from "./components/Recipients";
import Swap from "./components/Swap";
import Tokens from "./components/Tokens";

function Header(props: { address: any; isConnected: any; connect: any; }) {
  const {address, isConnected, connect} = props;

  return (
    <header>
      <div className={styles.leftH}>
        <Image src={Image1} width={25} height={25} alt="Sponsor Coin Logo" />
        <div className={styles.headerItem}><Swap /></div>
        <div className={styles.headerItem}><Recipients /></div>
        <div className={styles.headerItem}><Agents /></div>
        <div className={styles.headerItem}><Tokens /></div>
      </div>
      <div className={styles.rightH}>
        <div className={styles.headerItem}>
          {/* <img src={Eth} alt="eth" className={styles.eth} /> */}
          Ethereum
        </div>
        <div className={styles.connectButton} onClick={connect}>
          {isConnected ? (address.slice(0,4) +"..." +address.slice(38)) : "Connect"}
        </div>
      </div>
    </header>
  );
}

export default Header;
