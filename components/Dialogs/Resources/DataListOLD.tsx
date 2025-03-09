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
import agentJsonList from '@/resources/data/agents/agentJsonList.json';
import recipientJsonList from '@/resources/data/recipients/recipientJsonList.json';
import { BASE, ETHEREUM, FEED_TYPE, HARDHAT, POLYGON, publicWalletPath, SEPOLIA, TokenContract } from '@/lib/structure/types';
import { useAccount, useChainId } from "wagmi";
import { BURN_ADDRESS, defaultMissingImage, useGetAddressAvatar, isActiveAccountToken } from '@/lib/network/utils';
import { Address } from 'viem';

const recipientWalletList = await loadWallets(publicWalletPath, recipientJsonList);

import * as fs from "fs";
import * as path from "path";
import { loadWallets } from '@/lib/spCoin/loadWallets';
function preloadWallets() {
    const walletsDirectory = "/assets/recipients/"

    try {
        const files = fs.readdirSync(walletsDirectory);

        files.forEach((file) => {
            if (file.endsWith(".json")) {
                const filePath = path.join(walletsDirectory, file);
                const fileContent = fs.readFileSync(filePath, "utf-8");
                const wallet: any = JSON.parse(fileContent);
                recipientWalletList.push(wallet);
            }
        });

        console.log("Preloaded Wallets:", recipientWalletList);
    } catch (error) {
        console.error("Error reading wallet files:", error);
    }
}


const getDataKey = (feedType:FEED_TYPE, dataFeedList:any) => {
    let address = dataFeedList.address;
    // const walletAddress = useAccount().address;
    // // alert(`zzzzzz walletAddress = ${walletAddress}`)
    // if (walletAddress && useIsActiveAccountAddress(address)) {
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

const getDataFeedList = (feedType: FEED_TYPE, network:string|number):any[] => {
    if (typeof network === "string")
      network = network.toLowerCase()
    switch (feedType) {
        case FEED_TYPE.AGENT_WALLETS: return agentJsonList as TokenContract[];
        case FEED_TYPE.TOKEN_LIST:
            switch(network) {
                case BASE:
                case "base": return baseTokenList as TokenContract[];
                case ETHEREUM:
                case "ethereum": return ethereumTokenList as TokenContract[];
                case POLYGON:
                case "polygon": return polygonTokenList as TokenContract[];
                case HARDHAT:
                case "hardhat": 
                return hardhatTokenList as TokenContract[];
                case SEPOLIA:
                case "sepolia": return sepoliaTokenList as TokenContract[];
                default: return ethereumTokenList as TokenContract[];
            }
        case FEED_TYPE.RECIPIENT_WALLETS: return recipientWalletList;
        default: return ethereumTokenList as TokenContract[];
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

const setMissingAvatar = (event: { currentTarget: { src: string; }; }, tokenContract: TokenContract) => {
    // ToDo Set Timer to ignore fetch if last call
    if(isActiveAccountToken(tokenContract))
        event.currentTarget.src = defaultMissingImage;
    else
        event.currentTarget.src = defaultMissingImage;
}

type Props = {
    dataFeedType: any,
    updateTokenCallback:  (listElement: any) => void
}

function DataList({ dataFeedType, updateTokenCallback }: Props) {
    const dataFeedList:TokenContract[] = getDataFeedList(dataFeedType, useChainId()) || [];

    const tList = dataFeedList.map((e: any, i: number) => (
        <div className="flex flex-row justify-between mb-1 pt-2 px-5 hover:bg-spCoin_Blue-900" 
            key={getDataKey(dataFeedType, e)}>
            <div 
                className="cursor-pointer flex flex-row justify-between" 
                onClick={() => updateTokenCallback(dataFeedList[i])}>
                {/* Ensure useGetAddressAvatar(e.address) is valid */}
                <img
                    className={styles.elementLogo} 
                    src={useGetAddressAvatar(e.address, dataFeedType)} 
                    alt={`${e.name} Token Avatar`} 
                    onError={(event) => setMissingAvatar(event, dataFeedList[i])}/>
                <div>
                    <div className={styles.elementName}>{e.name}</div>
                    <div className={styles.elementSymbol}>{e.symbol}</div>
                </div>
            </div>
            <div 
                className="py-3 cursor-pointer rounded border-none w-8 h-8 text-lg font-bold text-white"  
                onClick={() => displayElementDetail(dataFeedList[i])}>
                <Image src={info_png} className={styles.infoLogo} alt="Info Image" />
            </div>
        </div>
    ));
    return <>{tList}</>;
}

export default DataList
export { 
    getDataFeedList,
    getDataFeedMap,
    getNetworkListElement,
    getDataFeedListElement,
    setActiveAccount
 }
