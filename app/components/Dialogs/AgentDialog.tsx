"use client"
import './Resources/Styles/modal.css';
import { useRef } from 'react'
import InputSelect from './Resources/InputSelect'
import DataList from './Resources/DataList'
import FEED  from '../../resources/data/feeds/feedTypes';

const TITLE_NAME = "Select an agent";
const INPUT_PLACE_HOLDER = 'Agent name or paste address';

// ToDo Read in data List remotely

const getAgentElements = () => {
    const methods:any = {};
    methods.dataFeedType = FEED.AGENT_WALLETS;
    return methods;
  }
//, {callBackSetter}:any, {recipientElement}:any

export default function Dialog({recipientElement, callBackSetter}:any) {
    const dialogRef = useRef<null | HTMLDialogElement>(null)

    const getSelectedListElement = (listElement: any) => {
        if (listElement.address === recipientElement.address) {
            alert("Agent cannot be the same as Recipient("+recipientElement.symbol+")")
            console.log("Agent cannot be the same as Recipient("+recipientElement.symbol+")");
            return false;
        }
        else {
            callBackSetter(listElement)
            closeDialog()
        }
    }

    const closeDialog = () => {
        dialogRef.current?.close();
    }

    const Dialog = (
        <dialog id="agentDialog" ref={dialogRef} className="modalContainer">
            <div className="flex flex-row justify-between mb-1 pt-0 px-3 text-gray-600">
                <h1 className="text-sm indent-9 mt-1">"{TITLE_NAME}"</h1>
                <div className="cursor-pointer rounded border-none w-5 text-xl text-white"
                    onClick={closeDialog}
                >X</div>
            </div>

            <div className="modalBox">
                <div className="modalInputSelect">
                    <InputSelect selectElement={INPUT_PLACE_HOLDER}/>
                </div>
                <div className="modalScrollBar">
                    <DataList dataFeedType={FEED.AGENT_WALLETS} getSelectedListElement={getSelectedListElement}/>
                </div>
            </div>
        </dialog>
    )
    return Dialog
}
