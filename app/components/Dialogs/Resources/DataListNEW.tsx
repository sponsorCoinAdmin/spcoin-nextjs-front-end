import React, { useState } from 'react'
import styles from './styles/Modal.module.css'
import Image from 'next/image'
import info_png from '../../../resources/images/info1.png'
import FEED  from '../../../resources/data/feeds/feedTypes'//data/feeds/feedTypes'';
import polygonTokenList from '../../../resources/data/Tokens/polygonTokenList.json';
import mainNetTokenList from '../../../resources/data/Tokens/ethereumTokenList.json';
import agentWalletList from '../../../resources/data/agents/agentWalletList.json';
import recipientWalletList from '../../../resources/data/recipients/recipientWalletList.json';
import {
    watchAccount,
    watchNetwork,
  } from "@wagmi/core";
  
  import {
      useChainId
    } from "wagmi";


type Props = {
    dataFeedType: string,
    getSelectedListElement:  (listElement: any) => void,
}

const fetchTokenList = async() => {
    const response = await fetch('https://raw.githubusercontent.com/sponsorCoinAdmin/coins/main/token-lists/polygonTokenList.json');
    const jsonResp = await response.json();
    alert(response);
    return "WORKS";
  }

function setFeed(feedType: any, chainId:any) {
    let feed;
    switch (feedType) {
        case FEED.AGENT_WALLETS:
            feed = agentWalletList;
        break;
        case FEED.MAINNET_TOKENS:
            feed = mainNetTokenList;
        break;
        case FEED.TOKEN_LIST:
            switch(chainId) {
                case 1: feed = mainNetTokenList;
                    // console.debug("NETWORK chainId = 1")
                break;
                case 137: feed = polygonTokenList;
                    // console.debug("NETWORK chainId = 137")
                break;
                default: feed = mainNetTokenList;
                    // console.debug("NETWORK chainId = default")
                break;
            }
        break;
        case FEED.RECIPIENT_WALLETS:
            feed = recipientWalletList;
        break;
        default:
        break;
    }
    return feed
}

function displayElementDetail (le: any) {
    alert("displayElementDetail\n" + JSON.stringify(le,null,2))
}

function DataList({dataFeedType, getSelectedListElement} : Props) {

    const [chainId, setChainId] = useState(useChainId());
    const unwatchNetwork = watchNetwork((network) => processNetworkChange(network))
    const processNetworkChange = ( network:any ) => {
      console.debug("SETTING APP NETWORK CHAIN ID = " + network.chain.id)
      setChainId(network?.chain?.id);
    }

    let dataList = setFeed(dataFeedType, chainId);
    const tList = dataList?.map((e: any, i: number) => (
        <div className="flex flex-row justify-between mb-1 pt-2 px-5 hover:bg-spCoin_Blue-900"  key={e.address}>
            <div className="cursor-pointer flex flex-row justify-between" onClick={() => getSelectedListElement(dataList[i])} >
                <img src={e.img} alt={e.symbol} className={styles.tokenLogo} />
                <div>
                    <div className={styles.tokenName}>{e.name}</div>
                    <div className={styles.tokenSymbol}>{e.symbol}</div> 
                </div>
            </div>
            <div className="py-3 cursor-pointer rounded border-none w-8 h-8 text-lg font-bold text-white"  onClick={() => displayElementDetail(dataList[i])}>
                <Image src={info_png} className={styles.infoLogo} alt="Info Image" />
            </div>
        </div>
    ))

    return (
        <div>
            {tList}
        </div>
    )
}

export default DataList
