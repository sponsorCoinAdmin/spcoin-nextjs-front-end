"use client"
import './Styles/modal.css';
import { useRef } from 'react'
import DataList from './DataList'

//import dataList from '../Dialogs/Resources/data/tokenEthList.json';
import dataList from '../Dialogs/Resources/data/tokenPolyList.json';
import InputSelect from './InputSelect'

const titleName ='Select an agent';

type ListElement = {
    chainId: number;
    ticker: string; 
    img: string; 
    name: string; 
    address: any; 
    decimals: number;
}

type Props = {
    selectElement: string,
    getDlgLstElement: (listElement: ListElement) => void,
}

export default function Dialog({ selectElement, getDlgLstElement}: Props) {
// alert("PARSED dataList: ListElement[] = " + JSON.stringify(dataList, null, 2))

    const dialogRef = useRef<null | HTMLDialogElement>(null)

    const getSelectedListElement = (listElement: ListElement) => {
        getDlgLstElement(listElement);
        closeDialog()
      }

    const closeDialog = () => {
        dialogRef.current?.close()
    }

    const dialog = (
        <dialog id="dialogList" ref={dialogRef} className="modalContainer">
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
