'use client'

import React, { useEffect, useState } from "react";
import styles from "@/styles/Header.module.css"
import { config } from '@/lib/wagmi/wagmiConfig'
import spCoin_png from '@/public/assets/miscellaneous/spCoin.png'
import Image from 'next/image'
import Link from 'next/link'
import ConnectButton from "../Buttons/ConnectButton"
import { defaultMissingImage, getBlockChainName, getBlockChainLogoURL } from "@/lib/network/utils";
import { useChainId } from "wagmi";

export default () => {
  const [networkName, setNetworkName] = useState<string>("Ethereum");
  const chainId = useChainId({ config });
  const [avatar, setAvatar] = useState<string>(getBlockChainLogoURL(chainId));

  useEffect(() => {
    let network: string = getBlockChainName(chainId) || "";
    setAvatar(getBlockChainLogoURL(chainId));
    setNetworkName(network);
  }, [chainId]);

  return (
    <header>
      <div className={styles.leftH}>
        <Image
          className={styles.avatarImg} // ✅ changed from imgOptions to avatarImg
          src={spCoin_png}
          width={25}
          height={25}
          alt="Sponsor Coin Logo"
        />
        <div className={styles.headerItem}><Link href="/SponsorCoin">SponsorCoin</Link></div>
        <div className={styles.headerItem}><Link href="/Exchange">Exchange</Link></div>
        <div className={styles.headerItem}><Link href="/Recipient">Recipient</Link></div>
        <div className={styles.headerItem}><Link href="/Admin">Admin</Link></div>
        <div className={styles.headerItem}><Link href="/Exchange/Test">Test</Link></div>
      </div>
      <div className={styles.rightH}>
        <div className={styles.headerItem}>
          <img
            src={avatar}
            className={styles.elementLogo}
            alt={`Header ChainId = ${chainId} Network = ${networkName}`}
            width={25}
            height={25}
            onError={(event) => { event.currentTarget.src = defaultMissingImage; }}
          />
          &nbsp;&nbsp;{networkName}
        </div>
        <ConnectButton />
      </div>
    </header>
  );
}
