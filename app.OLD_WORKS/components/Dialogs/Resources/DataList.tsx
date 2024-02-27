import React, { useState } from 'react'
import styles from './styles/Modal.module.css'
import Image from 'next/image'
import info_png from '../../../../public/resources/images/info1.png'
import FEED  from '../../../resources/data/feeds/feedTypes'//data/feeds/feedTypes'';
import polygonTokenList from '../../../resources/data/Tokens/polygonTokenList.json';
import sepoliaTokenList from '../../../resources/data/Tokens/sepoliaTokenList.json';
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

const getDataFeedList = (feedType: any, chainId:any) => {
    let dataFeedList;
    // console.debug("NETWORK chainId = " + chainId)
    switch (feedType) {
        case FEED.AGENT_WALLETS:
            dataFeedList = agentWalletList;
        break;
        case FEED.TOKEN_LIST:
            switch(chainId) {
                case 1: dataFeedList = ethereumTokenList;
                break;
                case 137: dataFeedList = polygonTokenList;
                break;
                case 11155111: dataFeedList = sepoliaTokenList;
                break;
                default: dataFeedList = ethereumTokenList;
                break;
            }
        break;
        case FEED.RECIPIENT_WALLETS:
            dataFeedList = recipientWalletList;
        break;
        default:
        break;
    }
    return dataFeedList
}

const getDataFeedMap = (feedType: any, chainId:any) => {
    let dataFeedList = getDataFeedList(feedType, chainId);
    let dataFeedMap = new Map(dataFeedList?.map((element: { address: any }) => [element.address, element]));
    return dataFeedMap
}

const getDataFeedListElement = (dataFeedList: any, addressKey:any) => {
    // let dataFeedList = getDataFeedList(feedType, chainId);
    let dataFeedMap = new Map(dataFeedList?.map((element: { address: any }) => [element.address, element]));
    let element:any = dataFeedMap.get(addressKey)
    // alert("DataList:getDataFeedListElement\n" +JSON.stringify(element))
    return element
}

function displayElementDetail (le: any) {
    alert("displayElementDetail\n" + JSON.stringify(le,null,2))
}

function DataList({dataFeedType, getSelectedListElement} : Props) {
    let dataFeedList = getDataFeedList(dataFeedType, useChainId());
    console.debug("dataFeedList = \n" +JSON.stringify(dataFeedList,null,2))
    const tList = dataFeedList?.map((e: any, i: number) => (
        <div className="flex flex-row justify-between mb-1 pt-2 px-5 hover:bg-spCoin_Blue-900"  key={e.address}>
            <div className="cursor-pointer flex flex-row justify-between" onClick={() => getSelectedListElement(dataFeedList[i])} >
                <img src={e.img} alt={e.symbol} className={styles.elementLogo} />
                <div>
                    <div className={styles.elementName}>{e.name}</div>
                    <div className={styles.elementSymbol}>{e.symbol}</div> 
                </div>
            </div>
            <div className="py-3 cursor-pointer rounded border-none w-8 h-8 text-lg font-bold text-white"  onClick={() => displayElementDetail(dataFeedList[i])}>
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
    getDataFeedList,
    getDataFeedMap,
    getDataFeedListElement
 }
