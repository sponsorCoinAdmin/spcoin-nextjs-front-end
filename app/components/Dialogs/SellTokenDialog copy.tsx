"use client"
import './Resources/Styles/modal.css';
import { useRef } from 'react'
import InputSelect from './Resources/InputSelect'
import DataList from './Resources/DataList'
import FEED  from '../../resources/data/feeds/feedTypes';
import { isAddress } from 'ethers';

const TITLE_NAME = "Select a token to sell";
const INPUT_PLACE_HOLDER = 'Sell token name or paste address';
const tokenSelect = document.getElementById('tokenSelect');        

// ToDo Read in data List remotely

export default function Dialog({ buyTokenElement, callBackSetter }: any) {
    const dialogRef = useRef<null | HTMLDialogElement>(null)

    const getSelectedListElement = (listElement: any) => {
        if (!isAddress(listElement.address)) {
            alert("Sell Token ("+listElement.symbol+"):\nHas invalid address: " + listElement.address)
            console.log("Sell Token ("+listElement.symbol+"):\nHas invalid address: " + listElement.address)
            return false;
        }
        if (listElement.address === buyTokenElement.address) {
            alert("Sell Token cannot be the same as Buy Token("+buyTokenElement.symbol+")")
            console.log("Sell Token cannot be the same as Buy Token("+buyTokenElement.symbol+")");
            return false;
        }
        callBackSetter(listElement)
        closeDialog()
    }

     const closeDialog = () => {
        dialogRef.current?.close()
    }

     const Dialog = (
        <dialog id="sellTokenDialog" ref={dialogRef} className="modalContainer">
            <form>
                <div className="flex flex-row justify-between mb-1 pt-0 px-3 text-gray-600">
                    <h1 className="text-sm indent-9 mt-1">{TITLE_NAME}</h1>
                    <div className="cursor-pointer rounded border-none w-5 text-xl text-white"
                        onClick={closeDialog}
                    >X</div>
                </div>

                <div className="modalBox" >
                    <div className="modalInputSelect">
                        <InputSelect selectElement={INPUT_PLACE_HOLDER} tokenSelect={tokenSelect}/>
                    </div>
                    <div id="tokenSelect" className="modalInputSelect">
                        <InputSelect selectElement={"BlaBlaBla"} autocomplete="off"/>
                    </div>
                    <div className="modalScrollBar">
                        <DataList dataFeedType={FEED.TOKEN_LIST} getSelectedListElement={getSelectedListElement}/>
                    </div>
                </div>
            </form>
        </dialog>
    )
    return Dialog
}
