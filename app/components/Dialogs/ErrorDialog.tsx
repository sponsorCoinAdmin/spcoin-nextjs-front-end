"use client"
import './Resources/Styles/modal.css';
import { useRef } from 'react'
import DataList from './Resources/DataList'
// ToDo Read in data List remotely

export default function Dialog({errMsg}:any) {
    const dialogRef = useRef<null | HTMLDialogElement>(null)

    const closeDialog = () => {
        dialogRef.current?.close();
    }

    const Dialog = (
        <dialog id="errorDialog" ref={dialogRef} className="modalContainer">
            <div className="flex flex-row justify-between mb-1 pt-0 px-3 text-gray-600">
                <h1 className="text-sm indent-9 mt-1">{errMsg.name}</h1>
                <div className="cursor-pointer rounded border-none w-5 text-xl text-white"
                    onClick={closeDialog}
                >X</div>
            </div>

            <div className="modalBox">
                <div className="modalScrollBar">
                    <h1>ERROR as Follows:</h1>
                    <div>
                        {errMsg.message}
                    </div>
                </div>
            </div>
        </dialog>
    )
    return Dialog
}
