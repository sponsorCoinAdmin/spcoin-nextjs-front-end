import React from 'react'
import styles from './styles/Modal.module.css'
import info_png from './images/info1.png'
import Image from 'next/image'
import FEED  from '../Resources/data/feeds/feedTypes';

import polygonTokenList from '../Resources/data/polygonTokenList.json';
import mainNetTokenList from '../Resources/data/mainNetTokenList.json';
import agentWalletList from '../Resources/data/agentWalletList.json';
import recipientWalletList from '../Resources/data/recipientWalletList.json';

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

function setFeed(feedType: any) {
    let feed;
    switch (feedType) {
        case FEED.AGENT_WALLETS:
            feed = agentWalletList;
        break;
        case FEED.MAINNET_TOKENS:
            feed = mainNetTokenList;
        break;
        case FEED.POLYGON_TOKENS:
            feed = polygonTokenList;
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
    let dataList = setFeed(dataFeedType);
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
