'use client'

import React, { useContext, useState } from "react";
import styles from "../../styles/Header.module.css"
import spCoin_png from '../../../public/resources/images/spCoin.png'
import Image from 'next/image'
import Link from 'next/link'
import ConnectButton from "./ConnectButton"
import { DownOutlined } from "@ant-design/icons";
import NetworkDialog from "../Dialogs/NetworkDialog";


import {
  useChainId
} from "wagmi";
import { id } from "ethers";
import { openDialog } from "../Dialogs/Dialogs";
import NetworkSelect from "../containers/NetworkSelect";
// import { ExchangeContext, TokenElement } from "@/app/lib/structure/types";
import { context } from "msw";
import { exchangeContext, resetContextNetwork } from "@/app/lib/context";
import { NetworkElement } from "@/app/lib/structure/types";

const imgHome = "/resources/images/chains/"
const imgOptions = ".png"
// const exchangeContext = useContext<ExchangeContext>(context);
let disabled = false

function Header() {
  const [networkElement, setNetworkElement] = useState<NetworkElement>(exchangeContext.network);

  function getTokenImageURL(chainId:number|string) {
    let imgURL:string = imgHome+chainId + imgOptions;
    return imgURL
  }

  return (
    <header>
      <NetworkDialog errMsg={"Header Test Message"} />
      <div className={styles.leftH}>
        <Image className={styles.imgOptions} src={spCoin_png} width={25} height={25} alt="Sponsor Coin Logo" />
        <div className={styles.headerItem}><Link href="/">SponsorCoin</Link></div>
        <div className={styles.headerItem}><Link href="/Exchange">Exchange</Link></div>
        <div className={styles.headerItem}><Link href="/Admin">Admin</Link></div>
        <div className={styles.headerItem}><Link href="/Recipient"></Link></div>
      </div>
      <div className={styles.rightH}>
        <div >
          <img src={getTokenImageURL(useChainId())} alt={'??'} width={20} height={20} className={styles.networkLogo} />
          <NetworkSelect networkElement={networkElement} id={"selectNetworkDialog"} disabled={disabled}></NetworkSelect>
          {/* <DownOutlined id={"selectNetworkDialog"} onClick={() => openDialog("#"+id)}/> */}
                      {/* &nbsp;&nbsp;{getNetworkName(useChainId())} */}
        </div>
        <ConnectButton />
      </div>
    </header>
  );
}

export default Header;