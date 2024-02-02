"use client"
import './Resources/Styles/modal.css';
import { useRef } from 'react'
import InputSelect from './Resources/InputSelect'
import DataList from './Resources/DataList'
// ToDo Read in data List remotely

export default function Dialog({ dialogMethods}: any) {
    const dialogRef = useRef<null | HTMLDialogElement>(null)

    const getSelectedListElement = (listElement: any) => {
        if(dialogMethods.setDlgLstElement(listElement))
            closeDialog()
    }

    const closeDialog = () => {
        dialogRef.current?.close()
    }

    const Dialog = (
        <dialog id="sellTokenDialog" ref={dialogRef} className="modalContainer">
            <div className="flex flex-row justify-between mb-1 pt-0 px-3 text-gray-600">
                <h1 className="text-sm indent-9 mt-1">{dialogMethods.titleName}</h1>
                <div className="cursor-pointer rounded border-none w-5 text-xl text-white"
                    onClick={closeDialog}
                >X</div>
            </div>

            <div className="modalBox" >
                <div className="modalInputSelect">
                    <InputSelect dataFeedType={dialogMethods.dataFeedType} selectElement={dialogMethods.placeHolder}/>
                </div>
                <div className="modalScrollBar">
                    <DataList dataFeedType={dialogMethods.dataFeedType} getSelectedListElement={getSelectedListElement}/>
                </div>
            </div>
        </dialog>
    )
    return Dialog
}
