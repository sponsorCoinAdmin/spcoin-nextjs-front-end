'use client';
import React from 'react'
import styles from '@/styles/Modal.module.css'
import Image from 'next/image'
import info_png from '@/public/assets/miscellaneous/info1.png'
import baseTokenList from '@/resources/data/networks/base/tokenList.json';
import hardhatTokenList from '@/resources/data/networks/hardhat/tokenList.json';
import polygonTokenList from '@/resources/data/networks/polygon/tokenList.json';
import sepoliaTokenList from '@/resources/data/networks/sepolia/tokenList.json';
import ethereumTokenList from '@/resources/data/networks/ethereum/tokenList.json';
import agentWalletList from '@/resources/data/agents/agentWalletList.json';
import recipientWalletList from '@/resources/data/recipients/recipientWalletList.json';
import { BASE, ETHEREUM, FEED_TYPE, HARDHAT, POLYGON, SEPOLIA, TokenContract } from '@/lib/structure/types';
import { useAccount, useChainId } from "wagmi";
import { BURN_ADDRESS, getTokenAvatar } from '@/lib/network/utils';
import { Address } from 'viem';

const getDataKey = (feedType:FEED_TYPE, dataFeedList:any) => {
    let address = dataFeedList.address;
    // const walletAddress = useAccount().address;
    // // alert(`zzzzzz walletAddress = ${walletAddress}`)
    // if (walletAddress && isActiveAccountAddress(address)) {
    //     address = walletAddress;
    //     dataFeedList.address = address;
    // }

    // switch (feedType) {
    //     case FEED_TYPE.TOKEN_LIST:
    //         switch(network) {
    //             case 1: return ethereumTokenList;
    //             case 137: return polygonTokenList;
    //             case 11155111: return sepoliaTokenList;
    //             default: return ethereumTokenList;
    //         }
    //     default: return address;
    // }
    // alert(`address = ${address}`)

    return address;
}

const getDataFeedList = (feedType: FEED_TYPE, network:string|number) => {
    if (typeof network === "string")
      network = network.toLowerCase()
    switch (feedType) {
        case FEED_TYPE.AGENT_WALLETS: return agentWalletList;
        case FEED_TYPE.TOKEN_LIST:
            switch(network) {
                case BASE:
                case "base": return baseTokenList;
                case ETHEREUM:
                case "ethereum": return ethereumTokenList;
                case POLYGON:
                case "polygon": return polygonTokenList;
                case HARDHAT:
                case "hardhat": 
                return hardhatTokenList;
                case SEPOLIA:
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

let ACTIVE_ACCOUNT_ADDRESS:Address;

const setActiveAccount = (address:Address) => {
    ACTIVE_ACCOUNT_ADDRESS = address;
}

function displayElementDetail (tokenContract:any) {
    const clone = { ...tokenContract } as TokenContract;
    clone.address = clone.address === BURN_ADDRESS ? ACTIVE_ACCOUNT_ADDRESS : clone.address
    // alert("displayElementDetail\n" + stringifyBigInt(tokenContract,null,2))
    alert(`${tokenContract?.name} Token Address = ${clone.address}`)
}

type Props = {
    dataFeedType: any,
    updateTokenCallback:  (listElement: any) => void,
}

function DataList({dataFeedType, updateTokenCallback}:Props) {
    let dataFeedList = getDataFeedList(dataFeedType, useChainId());
    const ACTIVE_ACCOUNT =  useAccount()
    const { address: tokenAddress } = useAccount();
    ACTIVE_ACCOUNT_ADDRESS = tokenAddress as Address;
    // console.debug("dataFeedList = \n" +JSON.stringify(dataFeedList,null,2))
    const tList = dataFeedList?.map((e: any, i: number) => (
        <div className="flex flex-row justify-between mb-1 pt-2 px-5 hover:bg-spCoin_Blue-900"  key={getDataKey( dataFeedType, e)}>
            <div className="cursor-pointer flex flex-row justify-between" onClick={() => updateTokenCallback(dataFeedList[i])} >
                {/* <img src={e.img} alt={e.symbol} className={styles.elementLogo} /> */}
                <img src={getTokenAvatar(e.chainId, e.address)} alt={e.symbol} className={styles.elementLogo} />
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
    getDataFeedListElement,
    setActiveAccount
 }
