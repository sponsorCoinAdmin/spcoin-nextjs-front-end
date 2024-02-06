"use client"
import './Resources/Styles/modal.css';
import { useEffect, useRef, useState } from 'react'
import styles from './Resources/styles/Modal.module.css';
import DataList from './Resources/DataList'
import FEED  from '../../resources/data/feeds/feedTypes';
import searchMagGlassGrey_png from '../../../public/resources/images/SearchMagGlassGrey.png'
import customUnknownToken_png from '../../../public/resources/images/agents/QuestionWhiteOnRed.png'
import Image from 'next/image'

const TITLE_NAME = "Select a token to sell";
const INPUT_PLACE_HOLDER = 'Type or paste token address';

// ToDo Read in data List remotely

export default function Dialog({ buyTokenElement, callBackSetter }: any) {
    const dialogRef = useRef<null | HTMLDialogElement>(null)
    const [tokenInput, setTokenInput] = useState("");
    const [tokenSelect, setTokenSelect] = useState("");

    useEffect(() => {
        closeDialog();
      }, []);

    const hideElement = (element:any) => {
        const el = document.getElementById(element);
        console.debug("hideElement(" + element +")")
        if (el != null) {
            el.style.display = 'none'
        }
    }

    const showElement = (element:any) => {
        const el = document.getElementById(element);
        console.debug("showElement(" + element +")")
        if (el != null) {
            el.style.display = 'block'
        }
    }

    const showHideTokenSelectGroup = (event:any) => {
        let inputText = event.target.value !== null ? event.target.value : "";
        setTokenInput(inputText)
        setTokenSelect(inputText);
        inputText === "" ? hideElement('tokenSelectGroup') : showElement('tokenSelectGroup')
        console.debug("inputText = " + inputText)
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
        setTokenInput("")
        setTokenSelect("");
        hideElement('tokenSelectGroup')
        dialogRef.current?.close()
    }

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
                        <input id="tokenInput" className={styles.modalInputSelect} autoComplete="off" placeholder={INPUT_PLACE_HOLDER} onChange={showHideTokenSelectGroup} value={tokenInput}/>
                    </div>
                </div>
                <div id="tokenSelectGroup" className="modalInputSelect">
                    <div className={styles.leftH} >
                        <Image id="tokenImage" src={customUnknownToken_png} className={styles.searchImage} alt="Search Image Grey" />
                        <input id="tokenSelect" className={styles.modalInputSelect} autoComplete="off" value={tokenSelect} />
                    </div>
                </div>
                


                <div className="modalScrollBar">
                    <div className="flex flex-row justify-between mb-1 pt-2 px-5 hover:bg-spCoin_Blue-900" >
                        <div className="cursor-pointer flex flex-row justify-between" onClick={() => getSelectedListElement("GetSelected Item")} >
                        <Image id="tokenImage" src={customUnknownToken_png} className={styles.searchImage} alt="Search Image Grey" />
                            <div>
                                <div className={styles.tokenName}>{"JUNK"}</div>
                                <div className={styles.tokenSymbol}>{"TEST"}</div> 
                            </div>
                        </div>
                        <div className="py-3 cursor-pointer rounded border-none w-8 h-8 text-lg font-bold text-white"  onClick={() => alert("Element Details")}>
                            <Image id="tokenImage" src={customUnknownToken_png} className={styles.searchImage} alt="Info Image" />
                        </div>
                    </div>
                </div>



                <div className="modalScrollBar">
                    <DataList dataFeedType={FEED.TOKEN_LIST} getSelectedListElement={getSelectedListElement}/>
                </div>
            </div>
        </dialog>
    )
    return Dialog
}
