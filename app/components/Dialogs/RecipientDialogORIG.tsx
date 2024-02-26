"use client"
import styles from './Resources/styles/Modal.module.css';
import { useRef } from 'react'
import InputSelect from './Resources/InputSelect'
import FEED  from '../../resources/data/feeds/feedTypes';
import DataList from './Resources/DataList';

const TITLE_NAME = "Select a recipient";
const INPUT_PLACE_HOLDER = 'Recipient name or paste address';
// ToDo Read in data List remotely

export default function Dialog({ agentElement, callBackSetter}: any) {
    const dialogRef = useRef<null | HTMLDialogElement>(null)

    const getSelectedListElement = (listElement: any) => {
        if (listElement.address === agentElement.address) {
            alert("Recipient cannot be the same as Agent ("+agentElement.symbol+")")
            console.log("Recipient cannot be the same as Agent("+agentElement.symbol+")");
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
        <dialog id="recipientDialog" ref={dialogRef} className={styles.modalContainer}>
            <div className="flex flex-row justify-between mb-1 pt-0 px-3 text-gray-600">
                <h1 className="text-sm indent-9 mt-1">{TITLE_NAME}</h1>
                <div className="cursor-pointer rounded border-none w-5 text-xl text-white"
                    onClick={closeDialog}
                >X</div>
            </div>

            <div className={styles.modalBox}>
                <div className={styles.modalElementSelect}>
                    <InputSelect selectElement={INPUT_PLACE_HOLDER}/>
                </div>
                <div className={styles.modalScrollBar}>
                    <DataList dataFeedType={FEED.RECIPIENT_WALLETS} getSelectedListElement={getSelectedListElement}/>
                </div>
            </div>
        </dialog>
    )
    return Dialog
}
