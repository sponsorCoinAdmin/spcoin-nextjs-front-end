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

export default function Header() {
  const [networkName, setNetworkName] = useState<string>("Ethereum");
  const chainId = useChainId({ config });
  const [logo, setLogo] = useState<string>(getBlockChainLogoURL(chainId));

  const SHOW_TEST_LINK = process.env.NEXT_PUBLIC_DEBUG_TEST_PAGE_ON === 'true';

  useEffect(() => {
    const network = getBlockChainName(chainId) || "";
    setLogo(getBlockChainLogoURL(chainId));
    setNetworkName(network);
  }, [chainId]);

  return (
    <header>
      <div className={styles.leftH}>
        <Image
          className={styles.logoImg}
          src={spCoin_png}
          width={25}
          height={25}
          alt="Sponsor Coin Logo"
        />
        <div className={styles.headerItem}><Link href="/SponsorCoin">SponsorCoin</Link></div>
        <div className={styles.headerItem}><Link href="/Exchange">Exchange</Link></div>
        <div className={styles.headerItem}><Link href="/Recipient">Recipient</Link></div>
        <div className={styles.headerItem}><Link href="/Admin">Admin</Link></div>
        {SHOW_TEST_LINK && (
          <div className={styles.headerItem}><Link href="/Exchange/Test">Test</Link></div>
        )}
      </div>
      <div className={styles.rightH}>
        <div className={styles.headerItem}>
          <img
            src={logo}
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
