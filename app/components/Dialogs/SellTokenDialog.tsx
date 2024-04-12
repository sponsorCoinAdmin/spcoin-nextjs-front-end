"use client"
import styles from './Resources/styles/Modal.module.css';
import { useEffect, useRef, useState } from 'react'
import searchMagGlassGrey_png from '../../../public/resources/images/SearchMagGlassGrey.png'
import customUnknownImage_png from '../../../public/resources/images/miscellaneous/QuestionWhiteOnRed.png'
import info_png from '../../../public/resources/images/info1.png'
import Image from 'next/image'
import { FEED_TYPE, TokenElement } from '@/app/lib/structure/types';
import { isAddress } from 'ethers'; // ethers v6
import { hideElement, showElement } from '@/app/lib/spCoin/guiControl';
import { getTokenDetails, fetchTokenDetails } from '@/app/lib/spCoin/utils';
import DataList from './Resources/DataList';
import { BURN_ADDRESS } from '@/app/lib/network/utils';

const TITLE_NAME = "Select a token to sell";
const INPUT_PLACE_HOLDER = 'Type or paste token to sell address';
const ELEMENT_DETAILS = "This container allows for the entry selection of a valid token address.\n"+
    "When the address entry is completed and selected, "+
    "this address will be verified prior to entry acceptance.\n"+
    "Currently, there is no image token lookup, but that is to come."

// ToDo Read in data List remotely
export default function Dialog({ connectedWalletAddr, buyTokenElement, callBackSetter }: any) {
    const dialogRef = useRef<null | HTMLDialogElement>(null)
    const [tokenInput, setTokenInput] = useState("");
    const [tokenSelect, setTokenSelect] = useState("");
    const [tokenElement, setTokenElement] = useState<TokenElement| undefined>();
    const chainId = buyTokenElement.chainId;
    if (connectedWalletAddr === undefined) 
        connectedWalletAddr = BURN_ADDRESS

    useEffect(() => {
        closeDialog();
      }, []);

    useEffect( () => {
        // alert("tokenInput Changed "+tokenInput)
        tokenInput === "" ? hideElement('sellSelectGroup') : showElement('sellSelectGroup')
        if (isAddress(tokenInput)) {
            setTokenDetails(tokenInput, setTokenElement)
        }
        else
            setTokenSelect("Invalid Token Address");
    }, [tokenInput]);

    useEffect( () => {
        // alert("tokenElement Changed "+tokenInput)
        if (tokenElement?.symbol != undefined)
            setTokenSelect(tokenElement.symbol);
    }, [tokenElement]);

    const setTokenInputField = (event:any) => {
        setTokenInput(event.target.value)
    }

    const setTokenDetails = async(tokenAddr: any, setTokenElement:any) => {
        return getTokenDetails(connectedWalletAddr, chainId, tokenAddr, setTokenElement)
    }

    const displayElementDetail = async(tokenAddr:any) => {
         if (!(await setTokenDetails(tokenAddr, setTokenElement))) {
            alert("SELL_ERROR:displayElementDetail Invalid Token Address: " + tokenInput + "\n\n" + ELEMENT_DETAILS)
            return false
        }
        alert("displayElementDetail\n" + JSON.stringify(tokenElement, null, 2) + "\n\n" + ELEMENT_DETAILS)
        return true
    }

    const getSelectedListElement = (listElement: TokenElement | undefined) => {
        // alert("getSelectedListElement: " +JSON.stringify(listElement,null,2))
        try {
            if (listElement === undefined) {
                alert("Invalid Token address : " + tokenInput)
                return false;
            }
            if (!isAddress(listElement.address)) {
                alert(`${listElement.name} has invalid token address : ${listElement.address}`)
                return false;
            }
            if (listElement.address === buyTokenElement.address) {
                alert("Sell Token cannot be the same as Buy Token("+buyTokenElement.symbol+")")
                console.log("Sell Token cannot be the same as Buy Token("+buyTokenElement.symbol+")");
                return false;
            }
            callBackSetter(listElement)
            closeDialog()
        } catch (e:any) {
            alert("SELL_ERROR:getSelectedListElement e.message" + e.message)
        }
        return false
    }

    const closeDialog = () => {
        setTokenInput("")
        setTokenSelect("");
        hideElement('sellSelectGroup')
        dialogRef.current?.close()
    }

    const Dialog = (
        <dialog id="sellTokenDialog" ref={dialogRef} className={styles.modalContainer}>
            <div className="flex flex-row justify-between mb-1 pt-0 px-3 text-gray-600">
                <h1 className="text-sm indent-9 mt-1">{TITLE_NAME}</h1>
                <div className="cursor-pointer rounded border-none w-5 text-xl text-white"
                    onClick={closeDialog}
                >X</div>
            </div>

            <div className={styles.modalBox} >
                <div className={styles.modalElementSelect}>
                    <div className={styles.leftH}>
                        <Image src={searchMagGlassGrey_png} className={styles.searchImage} alt="Search Image Grey" />
                        <input id="tokenInput" className={styles.modalElementSelect} autoComplete="off" placeholder={INPUT_PLACE_HOLDER} onChange={setTokenInputField} value={tokenInput}/>
                        &nbsp;
                    </div>
                </div>
                    <div id="sellSelectGroup" className={styles.modalInputSelect}>
                    <div className="flex flex-row justify-between mb-1 pt-2 px-5 hover:bg-spCoin_Blue-900" >
                        <div className="cursor-pointer flex flex-row justify-between" onClick={() => getSelectedListElement(tokenElement)} >
                            <Image id="tokenImage" src={customUnknownImage_png} className={styles.elementLogo} alt="Search Image Grey" />
                            <div>
                                <div className={styles.elementName}>{tokenSelect}</div>
                                <div className={styles.elementSymbol}>{"User Specified Token"}</div> 
                            </div>
                        </div>
                        <div className="py-3 cursor-pointer rounded border-none w-8 h-8 text-lg font-bold text-white"  onClick={() => displayElementDetail(tokenInput)}>
                            <Image src={info_png} className={styles.infoLogo} alt="Info Image" />
                        </div>
                    </div>
                </div>
                <div className={styles.modalScrollBar}>
                    <DataList dataFeedType={FEED_TYPE.TOKEN_LIST} getSelectedListElement={getSelectedListElement}/>
                </div>
            </div>
        </dialog>
    )
    return Dialog
}
