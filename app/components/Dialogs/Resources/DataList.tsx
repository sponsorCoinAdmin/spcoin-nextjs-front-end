import React, { useState } from 'react'
import styles from './styles/Modal.module.css'
import Image from 'next/image'
import info_png from '../../../../public/resources/images/info1.png'
import FEED  from '../../../resources/data/feeds/feedTypes'//data/feeds/feedTypes'';
import polygonTokenList from '../../../resources/data/Tokens/polygonTokenList.json';
import sepoliaTokenList from '../../../resources/data/Tokens/sepoliaTokenList.json';
import chainIdList from '../../../resources/data/networks/chainIds.json';
import ethereumTokenList from '../../../resources/data/Tokens/ethereumTokenList.json';
import agentWalletList from '../../../resources/data/agents/agentWalletList.json';
import recipientWalletList from '../../../resources/data/recipients/recipientWalletList.json';

import {
      useChainId
} from "wagmi";

type Props = {
    dataFeedType: string,
    getSelectedListElement:  (listElement: any) => void,
}

// NetworkChain Id functions for export
const chainIdJsonList:any[] = chainIdList
const getChainMap = (chainList: any[]) => {
    let chainMap = new Map();
    const tList = chainList?.map((e: any, i: number) => {
        chainMap.set(chainList[i].chainId,chainList[i])
    })
    return chainMap
}
const chainIdMap = getChainMap(chainIdList)
const getNetworkName = (chainId:number) => {
    return chainIdMap?.get(chainId)?.name;
}

function setFeed(feedType: any, chainId:any) {
    let feed;
    // console.debug("NETWORK chainId = " + chainId)
    switch (feedType) {
        case FEED.AGENT_WALLETS:
            feed = agentWalletList;
        break;
        case FEED.TOKEN_LIST:
            switch(chainId) {
                case 1: feed = ethereumTokenList;
                break;
                case 137: feed = polygonTokenList;
                break;
                case 11155111: feed = sepoliaTokenList;
                break;
                default: feed = ethereumTokenList;
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
    let dataList = setFeed(dataFeedType, useChainId());
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
export {
    chainIdJsonList,
    chainIdMap,
    getChainMap,
    getNetworkName
}
