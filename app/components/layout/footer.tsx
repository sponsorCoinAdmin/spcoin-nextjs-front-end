import React from "react";
import styles from "../../styles/App.module.css";

import spCoin_png from '../images/spCoin.png'
import eth_png from '../images/eth.png'
import Image from 'next/image'

// import Eth from "./eth.svg";
import Agents from "../menuTabs/Agents";
import Recipients from "../menuTabs/Recipients";
import Swap from "../menuTabs/Swap";
import Tokens from "../menuTabs/Tokens";

function Footer(props: { address: any; isConnected: any; connect: any; }) {
  const {address, isConnected, connect} = props;

  return (
    <footer>
      <div className={styles.leftH}>
        <Image src={spCoin_png} width={25} height={25} alt="Sponsor Coin Logo" />
        <div className={styles.headerItem}><Swap /></div>
        <div className={styles.headerItem}><Recipients /></div>
        <div className={styles.headerItem}><Agents /></div>
        <div className={styles.headerItem}><Tokens /></div>
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
    </footer>
  );
}

export default Footer;
