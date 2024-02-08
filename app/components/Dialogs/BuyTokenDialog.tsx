"use client"
import styles from './Resources/styles/Modal.module.css';
import { useRef } from 'react'
import InputSelect from './Resources/InputSelect'
import DataList from './Resources/DataList'
import FEED  from '../../resources/data/feeds/feedTypes';

const TITLE_NAME = "Select a token to buy";
const INPUT_PLACE_HOLDER = 'Buy token name or paste address';
// ToDo Read in data List remotely

export default function Dialog({ sellTokenElement, callBackSetter }: any) {
    const dialogRef = useRef<null | HTMLDialogElement>(null)

    const getSelectedListElement = (listElement: any) => {
        if (listElement.address === sellTokenElement.address) {
            alert("Buy Token cannot be the same as Sell Token("+sellTokenElement.symbol+")")
            console.log("Buy Token cannot be the same as Sell Token("+sellTokenElement.symbol+")");
            return false;
        }
        else {
            callBackSetter(listElement)
            closeDialog()
        }
    }

     const closeDialog = () => {
        dialogRef.current?.close()
    }

    const Dialog = (
        <dialog id="buyTokenDialog" ref={dialogRef} className={styles.modalContainer}>
            <div className="flex flex-row justify-between mb-1 pt-0 px-3 text-gray-600">
                <h1 className="text-sm indent-9 mt-1">{TITLE_NAME}</h1>
                <div className="cursor-pointer rounded border-none w-5 text-xl text-white"
                    onClick={closeDialog}
                >X</div>
            </div>

            <div className={styles.modalBox}>
                <div className={styles.modalTokenSelect}>
                    <InputSelect selectElement={INPUT_PLACE_HOLDER}/>
                </div>
                <div className={styles.modalScrollBar}>
                    <DataList dataFeedType={FEED.TOKEN_LIST} getSelectedListElement={getSelectedListElement}/>
                </div>
            </div>
        </dialog>
    )
    return Dialog
}
