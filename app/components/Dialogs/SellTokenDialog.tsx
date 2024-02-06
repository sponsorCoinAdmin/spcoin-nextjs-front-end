"use client"
import './Resources/Styles/modal.css';
import { useRef } from 'react'
import styles from './Resources/styles/Modal.module.css';
import DataList from './Resources/DataList'
import FEED  from '../../resources/data/feeds/feedTypes';
import searchMagGlassGrey_png from '../../../public/resources/images/SearchMagGlassGrey.png'
import Image from 'next/image'

const TITLE_NAME = "Select a token to sell";
const INPUT_PLACE_HOLDER = 'Sell token name or paste address';
// ToDo Read in data List remotely

export default function Dialog({ buyTokenElement, callBackSetter }: any) {
    const dialogRef = useRef<null | HTMLDialogElement>(null)

    const showHideToken = (event:any) => {
        const tokenSelect = document.getElementById('tokenSelect');        
        alert(event.target.value)
        alert("tokenSelect.style.display " + tokenSelect);
        let inputText = event.target.value !== null ? event.target.value : "";
        let showElement = inputText === "" ? false : true;
        if (tokenSelect != null) {
          tokenSelect.style.display = showElement ? 'block' : 'none'
        }
    }
      
    const getSelectedListElement = (listElement: any) => {
        if (listElement.address === buyTokenElement.address) {
            alert("Sell Token cannot be the same as Buy Token("+buyTokenElement.symbol+")")
            console.log("Sell Token cannot be the same as Buy Token("+buyTokenElement.symbol+")");
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

    // alert("tokenSelect = " + tokenSelect)

    const Dialog = (
        <dialog id="sellTokenDialog" ref={dialogRef} className="modalContainer">
            <div className="flex flex-row justify-between mb-1 pt-0 px-3 text-gray-600">
                <h1 className="text-sm indent-9 mt-1">{TITLE_NAME}</h1>
                <div className="cursor-pointer rounded border-none w-5 text-xl text-white"
                    onClick={closeDialog}
                >X</div>
            </div>

            <div className="modalBox" >
                <div className="modalInputSelect">
                    <div className={styles.leftH}>
                        <Image src={searchMagGlassGrey_png} className={styles.searchImage} alt="Search Image Grey" />
                        <input className={styles.modalInputSelect} autoComplete="off" placeholder={INPUT_PLACE_HOLDER} onChange={showHideToken} />
                    </div>
                </div>
                {/* <div className={styles.leftH}>
                <input id="tokenSelect" className={styles.modalInputSelect} autoComplete="off" placeholder={selectElement} />
                </div> */}
                <div className="modalScrollBar">
                    <DataList dataFeedType={FEED.TOKEN_LIST} getSelectedListElement={getSelectedListElement}/>
                </div>
            </div>
        </dialog>
    )
    return Dialog
}
