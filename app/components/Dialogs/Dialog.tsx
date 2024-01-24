"use client"
import './Resources/Styles/modal.css';
import { useRef } from 'react'
import DataList from './Resources/DataList'
import FEED  from './Resources/data/feeds/feedTypes';

// let data = require('https://raw.githubusercontent.com/sponsorCoinAdmin/coins/main/token-lists/polygonTokenList.json');

import InputSelect from './Resources/InputSelect'

type ListElement = {
    chainId: number;
    symbol: string; 
    img: string; 
    name: string; 
    address: any; 
    decimals: number;
}

type Props = {
    dataFeedType: string,
    setDlgLstElement: (listElement: ListElement) => boolean,
}

let titleName:string;
let PLACE_HOLDER:string;
function setDialog(feedType: any) {
    let feed;
    const dialog = document.querySelector("#dialogList")
    switch (feedType) {
        case FEED.AGENT_WALLETS:
            console.log("setDialog(feedType: "+feedType)
            if (dialog != null) {dialog.id = "agentDialog"; }
            titleName = "Select a recipient's agent";
            PLACE_HOLDER ='Search agent name or paste address';
        break;
        case FEED.MAINNET_TOKENS:
            console.log("setDialog(feedType: "+feedType)
            if (dialog != null) {dialog.id = "mainnetDialog"; }
            titleName = 'Select a token from mainnet';
            PLACE_HOLDER = 'Search mainnet token name or paste address';
        break;
        case FEED.TOKEN_LIST:
            console.log("setDialog(feedType: "+feedType)
            if (dialog != null) {dialog.id = "polygonDialog"; }
            titleName ='Select a token from polygon';
            PLACE_HOLDER = 'Search polygon token name or paste address';
        break;
        case FEED.RECIPIENT_WALLETS:
            console.log("setDialog(feedType: "+feedType)
            if (dialog != null) {dialog.id = "recipientDialog"; }
            titleName = 'Select a recipient to sponsor';
            PLACE_HOLDER = 'Search recipient name or paste address';
        break;
        default:
        break;
    }
    // if (dialog != null) {
    //     alert( "ZZZZZZZZZZZZ reset dialog to " + dialog.id )
    // }
    // else alert("dialog = "+ dialog)
    return feed
}

export default function Dialog({ dialogMethods}: any) {
    setDialog(dialogMethods.dataFeedType);
    const dialogRef = useRef<null | HTMLDialogElement>(null)

    const getSelectedListElement = (listElement: ListElement) => {
        if(dialogMethods.setDlgLstElement(listElement))
            closeDialog()
    }

    const closeDialog = () => {
        dialogRef.current?.close()
    }

    const Dialog = (
        <dialog id="dialogList" ref={dialogRef} className="modalContainer">
            <div className="flex flex-row justify-between mb-1 pt-0 px-3 text-gray-600">
                <h1 className="text-sm indent-9 mt-1">{titleName}</h1>
                <div className="cursor-pointer rounded border-none w-5 text-xl text-white"
                    onClick={closeDialog}
                >X</div>
            </div>

            <div className="modalBox">
                <div className="modalInputSelect">
                    <InputSelect dataFeedType={dialogMethods.dataFeedType} selectElement={PLACE_HOLDER}/>
                </div>
                <div className="modalScrollBar">
                    <DataList dataFeedType={dialogMethods.dataFeedType} getSelectedListElement={getSelectedListElement}/>
                </div>
            </div>
        </dialog>
    )
    return Dialog
}
