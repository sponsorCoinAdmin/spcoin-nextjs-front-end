"use client"
import './Styles/modal.css';
import { useRef } from 'react'
import DataList from './DataList'
import InputSelect from './InputSelect'
import { type Address } from "wagmi";

// import dataList from '../Resources/data/tokenEthList.json';
import jsonList from './Resources/data/tokenEthList.json';


type ListElement = {
    chainId: number;
    ticker: string; 
    img: string; 
    name: string; 
    address: any; 
    decimals: number;
}

type Props = {
    titleName: any,
    selectElement: string,
    dataList: ListElement[],
    onClose:  () => void,
    getDlgLstElement: (listElement: ListElement) => void,
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

let dataList3: ListElement[] = jsonList;

let dataList2: ListElement[] = [
    {
        "chainId": 1,
        "ticker": "USDC",
        "img": "https://cdn.moralis.io/eth/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png",
        "name": "USD Coin",
        "address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        "decimals": 6
    },
    {
        "chainId": 1,
        "ticker": "LINK",
        "img": "https://cdn.moralis.io/eth/0x514910771af9ca656af840dff83e8264ecf986ca.png",
        "name": "Chainlink",
        "address": "0x514910771af9ca656af840dff83e8264ecf986ca",
        "decimals": 18
    },
    {
        "chainId": 1,
        "ticker": "USDT",
        "img": "https://cdn.moralis.io/eth/0xdac17f958d2ee523a2206206994597c13d831ec7.png",
        "name": "Tether USD",
        "address": "0xdac17f958d2ee523a2206206994597c13d831ec7",
        "decimals": 6
    },
    {
        "chainId": 1,
        "ticker": "GUSD",
        "img": "https://cdn.moralis.io/eth/0x056fd409e1d7a124bd7017459dfea2f387b6d5cd.png",
        "name": "Gemini USD",
        "address": "0x056Fd409E1d7A124BD7017459dFEa2F387b6d5Cd",
        "decimals": 2
    },
    {
        "chainId": 1,
        "ticker": "DAI",
        "img": "https://cdn.moralis.io/eth/0x6b175474e89094c44da98b954eedeac495271d0f.png",
        "name": "Dai Stablecoin",
        "address": "0x6b175474e89094c44da98b954eedeac495271d0f",
        "decimals": 18
    },
    {
        "chainId": 1,
        "ticker": "WETH",
        "img": "https://cdn.moralis.io/eth/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2.png",
        "name": "Wrapped Ethereum",
        "address": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        "decimals": 18
    },
    {
        "chainId": 1,
        "ticker": "WBTC",
        "img": "https://cdn.moralis.io/eth/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599.png",
        "name": "Wrapped Bitcoin",
        "address": "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
        "decimals": 8
    },
    {
        "chainId": 1,
        "ticker": "MATIC",
        "img": "https://cdn.moralis.io/eth/0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0.png",
        "name": "Matic Token",
        "address": "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
        "decimals": 18
    },
    {
        "chainId": 1,
        "ticker": "UNI",
        "img": "https://cdn.moralis.io/eth/0x1f9840a85d5af5bf1d1762f925bdaddc4201f984.png",
        "name": "Uniswap",
        "address": "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
        "decimals": 18
    },
    {
        "chainId": 1,
        "ticker": "CRV",
        "img": "https://cdn.moralis.io/eth/0xd533a949740bb3306d119cc777fa900ba034cd52.png",
        "name": "Curve DAO Token",
        "address": "0xd533a949740bb3306d119cc777fa900ba034cd52",
        "decimals": 18
    },
    {
        "chainId": 1,
        "ticker": "MKR",
        "img": "https://cdn.moralis.io/eth/0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2.png",
        "name": "Maker",
        "address": "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2",
        "decimals": 18
    },
    {
        "chainId": 1,
        "ticker": "SHIB",
        "img": "https://cdn.moralis.io/eth/0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce.png",
        "name": "Shiba Inu",
        "address": "0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce",
        "decimals": 18
    },
    {
        "chainId": 1,
        "ticker": "AAVE",
        "img": "https://cdn.moralis.io/eth/0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9.png",
        "name": "AAVE",
        "address": "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
        "decimals": 18
    },
    {
        "chainId": 1,
        "ticker": "SPCT_V001",
        "img": "https://cdn.moralis.io/eth/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png",
        "name": "Sponsor Coin",
        "address": "0x7d4e590f15E424Dd635822529a2b24D7Bc18935a",
        "decimals": 18
    }
]
///////////////////////////////////////////////////////////////////////////////////////////////////////////////





export default function Dialog({ titleName, selectElement, dataList, onClose, getDlgLstElement}: Props) {

//     let dataList2: ListElement[] = dataList;

// alert("PARSED dataList: ListElement[] = " + JSON.stringify(dataList, null, 2))

// dataList = jsonList;


    const dialogRef = useRef<null | HTMLDialogElement>(null)

    const getSelectedListElement = (listElement: ListElement) => {
        getDlgLstElement(listElement);
        closeDialog()
      }

    const closeDialog = () => {
        dialogRef.current?.close()
        onClose()
    }

    const dialog = (
        <dialog id="dialogList" ref={dialogRef} className="modalContainer">
            <div className="flex flex-row justify-between mb-1 pt-0 px-3 text-gray-600">
                <h1 className="text-sm indent-9 mt-1">{titleName}</h1>
                <div className="cursor-pointer rounded border-none w-5 text-xl text-white"
                    onClick={closeDialog}
                >X</div>
            </div>

            <div className="modalBox">
                <div className="modalInputSelect">
                    <InputSelect selectElement={selectElement}/>
                </div>
                <div className="modalScrollBar">
                    <DataList dataList={dataList} selectElement={selectElement} getSelectedListElement={getSelectedListElement}/>
                </div>
            </div>
        </dialog>
    )
    return dialog
}
