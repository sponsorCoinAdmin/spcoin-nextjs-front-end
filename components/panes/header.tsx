'use client'

import React, { useEffect, useState } from "react";
import styles from "@/styles/Header.module.css"
import { config } from '@/lib/wagmi/wagmiConfig'
import spCoin_png from '@/public/assets/miscellaneous/spCoin.png'
import Image from 'next/image'
import Link from 'next/link'
import ConnectButton from "../Buttons/ConnectButton"
import { getBlockChainName, getNativeAvatar } from "@/lib/network/utils";

import { useChainId } from "wagmi";

export default () => {
  const [networkName, setNetworkName] = useState<string>("Ethereum");
  const [avatar, setAvatar] = useState<string>("/assets/blockchains/1/info/logo.png");
  const chainId = useChainId({config});
  let network:string = getBlockChainName(chainId)
  // ToDo Optimize this: useEffect is used to set the network and image for the set chainId when
  // the networkName async is complete.
  // This is required because NextJS Currently does not allow aync functions in client components.
  useEffect(() => {
    setAvatar(getNativeAvatar(chainId));
    setNetworkName(network);
  }, [network]);

  return (
    <header>
      <div className={styles.leftH}>
        <Image className={styles.imgOptions} src={spCoin_png} width={25} height={25} alt="Sponsor Coin Logo" />
        <div className={styles.headerItem}><Link href="/SponsorCoin">SponsorCoin</Link></div>
        <div className={styles.headerItem}><Link href="/Exchange">Exchange</Link></div>
        <div className={styles.headerItem}><Link href="/Admin">Admin</Link></div>
        <div className={styles.headerItem}><Link href="/Exchange/Test">Test</Link></div>
      </div>
      <div className={styles.rightH}>
        <div className={styles.headerItem}>
          <img src={avatar} alt={'??'} width={20} height={20} className={styles.elementLogo}/>
           &nbsp;&nbsp;{networkName}
        </div>
        <ConnectButton />
      </div>
    </header>
  );
}