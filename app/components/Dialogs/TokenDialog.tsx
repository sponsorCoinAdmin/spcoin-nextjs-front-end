"use client"
import './Resources/Styles/modal.css';
import { useRef } from 'react'
import DataList from './Resources/DataList'
import FEED  from './Resources/data/feeds/feedTypes';

// let data = require('https://raw.githubusercontent.com/sponsorCoinAdmin/coins/main/token-lists/polygonTokenList.json');

import InputSelect from './Resources/InputSelect'

type Props = {
    dataFeedType: string,
    getDlgLstElement: (listElement: any) => boolean,
}

let titleName:string = "Select a token";
let PLACE_HOLDER:string = 'Search token or paste address';

export default function TokenDialog({ dataFeedType, getDlgLstElement}: Props) {
    const dialogRef = useRef<null | HTMLDialogElement>(null)

    const getSelectedListElement = (listElement: any) => {
        if(getDlgLstElement(listElement))
            closeDialog()
    }

    const closeDialog = () => {
        dialogRef.current?.close()
    }

    const TokenDialog = (
        <dialog id="tokenDialog" ref={dialogRef} className="modalContainer">
            <div className="flex flex-row justify-between mb-1 pt-0 px-3 text-gray-600">
                <h1 className="text-sm indent-9 mt-1">{titleName}</h1>
                <div className="cursor-pointer rounded border-none w-5 text-xl text-white"
                    onClick={closeDialog}
                >X</div>
            </div>

            <div className="modalBox">
                <div className="modalInputSelect">
                    <InputSelect dataFeedType={dataFeedType} selectElement={PLACE_HOLDER}/>
                </div>
                <div className="modalScrollBar">
                    <DataList dataFeedType={dataFeedType} getSelectedListElement={getSelectedListElement}/>
                </div>
            </div>
        </dialog>
    )
    return TokenDialog
}
