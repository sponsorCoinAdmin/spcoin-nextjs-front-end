"use client"
import './Styles/modal.css';
import { useRef } from 'react'
import DataList from './DataLists/TokenDataList'
// let data = require('https://raw.githubusercontent.com/sponsorCoinAdmin/coins/main/token-lists/tokenPolyList.json');

// import dataList from './Resources/data/tokenPolyList.json';
// import dataList from './Resources/data/tokenEthList.json';
// import dataList from './Resources/data/maticNetworkList.json';
import InputSelect from './InputSelect'

const titleName ='Select a Token';

type TokenElement = {
    chainId: number;
    symbol: string; 
    img: string; 
    name: string; 
    address: any; 
    decimals: number;
}

type Props = {
    selectElement: string,
    dataList: TokenElement[],
    getDlgLstElement: (listElement: TokenElement) => boolean,
}

const fetchTokenList = async() => {
    const response = await fetch('https://raw.githubusercontent.com/sponsorCoinAdmin/coins/main/token-lists/tokenPolyList.json');
    const jsonResp = await response.json();
    alert(response);
    return "WORKS";
  }

// await fetchTokenList()
  
// async function fetchTokenList() {
//     const response = await fetch("https://raw.githubusercontent.com/sponsorCoinAdmin/coins/main/token-lists/tokenPolyList.json");
//     const jsonResp = await response.json();
//     // const tList = JSON.stringify(jsonResp, null, 2);
//     // const tList = JSON.stringify(await response.json(),null,2);
//     // alert(tList);
//   }
  

export default function Dialog({ dataList, selectElement, getDlgLstElement}: Props) {
// alert("PARSED dataList: TokenElement[] = " + JSON.stringify(dataList, null, 2))

    const dialogRef = useRef<null | HTMLDialogElement>(null)

    const getSelectedListElement = (listElement: TokenElement) => {
        if(getDlgLstElement(listElement))
            closeDialog()
    }

    const closeDialog = () => {
        dialogRef.current?.close()
    }

    const dialog = (
        <dialog id="agentList" ref={dialogRef} className="modalContainer">
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
