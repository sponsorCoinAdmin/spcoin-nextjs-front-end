"use client"
import { useSearchParams } from 'next/navigation'
import { useRef, useEffect, useState, ReactNode } from 'react'
import DataList from './DataList'
import InputSelect from './InputSelect'
import { type Address } from "wagmi";

type ListElement = {
    chainId: number;
    symbol: string; 
    img: string; 
    name: string; 
    address: any; 
    decimals: number;
}

type Props = {
    titleName: string,
    selectElement: any,
    dataList: ListElement[],
    onClose:  () => void,
    getDlgLstElement: (listElement: ListElement) => void,
}

export default function Dialog({ titleName, selectElement, dataList, onClose, getDlgLstElement}: Props) {
    const searchParams = useSearchParams()
    const dialogRef = useRef<null | HTMLDialogElement>(null)
    const showDialog = searchParams.get('showDialog')

    const getSelectedListElement = (listElement: ListElement) => {
        // alert("Modifying Agent Object FROM AgentDlgLstBtn.tsx" + JSON.stringify(listElement, null, 2));
        getDlgLstElement(listElement);
        closeDialog()
      }

    useEffect(() => {
        if (showDialog === 'y') {
            dialogRef.current?.showModal()
        } else {
            closeDialog()
        }
    }, [showDialog])

    const closeDialog = () => {
        dialogRef.current?.close()
        onClose()
    }

    const dialog = (
        <dialog id="AgentDialogList" ref={dialogRef} >
            <div className="modalContainer">
                <div className="flex flex-row justify-between mb-1 pt-0 px-3 text-gray-600">
                    <h1 className="text-sm indent-9 mt-1">{titleName}</h1>
                    <button
                        onClick={closeDialog}
                        className="cursor-pointer rounded border-none w-3 text-xl text-white"
                    >X</button>
                </div>

                <div className="modalBox">
                    <div className="modalInputSelect">
                        <InputSelect selectElement={selectElement}/>
                    </div>
                    <div className="modalScrollBar">
                        <DataList dataList={dataList} selectElement={selectElement} getSelectedListElement={getSelectedListElement}/>
                    </div>
                </div>
            </div>
        </dialog>
    )
    return dialog
}
