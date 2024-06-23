import React from 'react'
import styles from './styles/Modal.module.css'
import Image from 'next/image'
import info_png from '../../../../public/resources/images/info1.png'
import polygonTokenList from '../../../resources/data/Tokens/polygonTokenList.json';
import sepoliaTokenList from '../../../resources/data/Tokens/sepoliaTokenList.json';
import ethereumTokenList from '../../../resources/data/Tokens/ethereumTokenList.json';
import agentWalletList from '../../../resources/data/agents/agentWalletList.json';
import recipientWalletList from '../../../resources/data/recipients/recipientWalletList.json';
import { FEED_TYPE } from '@/lib/structure/types';
import { useChainId } from "wagmi";

type Props = {
    dataFeedType: string,
    getSelectedListElement:  (listElement: any) => void,
}

const getDataFeedList = (feedType: any, network:string|number) => {
    if (typeof network === "string")
      network = network.toLowerCase()
    // console.debug("NETWORK network = " + network)
    switch (feedType) {
        case FEED_TYPE.AGENT_WALLETS: return agentWalletList;
        case FEED_TYPE.TOKEN_LIST:
            switch(network) {
                case 1:
                case "ethereum": return ethereumTokenList;
                case 137:
                case "polygon": return polygonTokenList;
                case 11155111:
                case "sepolia": return sepoliaTokenList;
                default: return ethereumTokenList;
            }
        case FEED_TYPE.RECIPIENT_WALLETS: return recipientWalletList;
        default: return ethereumTokenList;
    }
}

const getDataFeedMap = (feedType: any, chainId:any) => {
    let dataFeedList = getDataFeedList(feedType, chainId);
    let dataFeedMap = new Map(dataFeedList?.map((element: { address: any }) => [element.address, element]));
    return dataFeedMap
}

const getNetworkListElement = (network: any, addressKey:any) => {
    // console.debug(`DataList:getNetworkListElement(${network}, ${addressKey})`)
    let dataFeedList = getDataFeedList(FEED_TYPE.TOKEN_LIST, network)
    // console.debug(`DataList:getNetworkListElement:dataFeedList = ${JSON.stringify(dataFeedList,null,2)}`)
    let element = getDataFeedListElement(dataFeedList, addressKey)
    // console.debug(`DataList:element:dataFeedList = ${JSON.stringify(element,null,2)}`)
    return element
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
    // console.debug("dataFeedList = \n" +JSON.stringify(dataFeedList,null,2))
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
    getNetworkListElement,
    getDataFeedListElement
 }
