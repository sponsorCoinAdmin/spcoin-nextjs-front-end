'use client'

import React, { useState } from "react";
import styles from "../../styles/Header.module.css"
import spCoin_png from '../../resources/images/spCoin.png'
import eth_png from '../../resources/images/eth.png'
import Image from 'next/image'
import Link from 'next/link'
import ConnectButton from "./ConnectButton";

import {
  watchNetwork,
} from "@wagmi/core";

function Header() {
  const [networkData, setNetworkData]=useState({chainId:'1',name:'Ethereum'});    
  const unwatchNetwork = watchNetwork((network) => processNetworkChange(network))
  const processNetworkChange = ( network:any ) => {
    setNetworkData({chainId:network.chain.id, name:network.chain.name})
    console.debug( "HEADER NETWORK = " + JSON.stringify(network, null, 2) )
    console.debug( "HEADER NETWORK NAME = " + network.chain.name )
  }  

  return (
    <header>
      <div className={styles.leftH}>
        <Image className={styles.avatarImg} src={spCoin_png} width={25} height={25} alt="Sponsor Coin Logo" />
        <div className={styles.headerItem}><Link href="/SponsorCoin">SponsorCoin</Link></div>
        <div className={styles.headerItem}><Link href="/Exchange">Exchange</Link></div>
        <div className={styles.headerItem}><Link href="/Admin">Admin</Link></div>
        {/* <div className={styles.headerItem}><Link href="/0X">0X</Link></div> */}
      </div>
      <div className={styles.rightH}>
        <div className={styles.headerItem}>
          <Image src={eth_png} width={25} height={25} alt="Ethereum Logo" />
          &nbsp;&nbsp;{networkData?.name}
        </div>
        <ConnectButton />

        {/* {<ConnectButton />} */}
      </div>
    </header>
  );
}

export default Header;