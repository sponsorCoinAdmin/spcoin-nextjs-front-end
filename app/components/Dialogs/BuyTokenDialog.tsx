"use client"
import InputSelect from './Resources/InputSelect'
/*
*/

import styles from './Resources/styles/Modal.module.css';
import { useEffect, useRef, useState } from 'react'
import DataList from './Resources/DataList'
import FEED  from '../../resources/data/feeds/feedTypes';
import { fetchStringBalance } from '../../lib/wagmi/api/fetchBalance'
import searchMagGlassGrey_png from '../../../public/resources/images/SearchMagGlassGrey.png'
import customUnknownToken_png from '../../../public/resources/images/agents/QuestionWhiteOnRed.png'
import info_png from '../../../public/resources/images/info1.png'
import Image from 'next/image'
import { TokenElement } from '@/app/lib/structure/types';
import { isAddress } from 'ethers'; // ethers v6

const TITLE_NAME = "Select a token to buy";
const INPUT_PLACE_HOLDER = 'Type or paste token to buy address';
const ELEMENT_DETAILS = "This container allows the entry of a valid token address For trading \n"+
    "when the address entry is completed and selected.\n"+
    "This address will be verified prior to entry acceptance.\n"+
    "Currently, there is no Image token lookup, but that is to come.\n"

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
