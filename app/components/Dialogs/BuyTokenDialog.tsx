"use client"
import styles from './Resources/styles/Modal.module.css';
import { useEffect, useRef, useState } from 'react'
import DataList from './Resources/DataList'
import FEED  from '../../resources/data/feeds/feedTypes';
import { fetchStringBalance } from '../../lib/wagmi/fetchBalance'
import searchMagGlassGrey_png from '../../../public/resources/images/SearchMagGlassGrey.png'
import customUnknownImage_png from '../../../public/resources/images/miscellaneous/QuestionWhiteOnRed.png'
import info_png from '../../../public/resources/images/info1.png'
import Image from 'next/image'
import { TokenElement } from '@/app/lib/structure/types';
import { isAddress } from 'ethers'; // ethers v6

const TITLE_NAME = "Select a token to buy";
const INPUT_PLACE_HOLDER = 'Type or paste token to buy address';
const ELEMENT_DETAILS = "This container allows for the entry selection of a valid token address.\n"+
    "When the address entry is completed and selected, "+
    "this address will be verified prior to entry acceptance.\n"+
    "Currently, there is no image token lookup, but that is to come."

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

// ToDo Read in data List remotely
export default function Dialog({ sellTokenElement, callBackSetter }: any) {
    const dialogRef = useRef<null | HTMLDialogElement>(null)
    const [tokenInput, setTokenInput] = useState("");
    const [tokenSelect, setTokenSelect] = useState("");
    const [tokenElement, setTokenElement] = useState<TokenElement| undefined>();
    const chainId = sellTokenElement.chainId;

    useEffect(() => {
        closeDialog();
      }, []);

    useEffect( () => {
        // alert("tokenInput Changed "+tokenInput)
        tokenInput === "" ? hideElement('buySelectGroup') : showElement('buySelectGroup')
        if (isAddress(tokenInput)) {
            setTokenDetails(tokenInput)
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

    const setTokenDetails = async(tokenAddr:any) => {
        try {
            if (isAddress(tokenAddr)) {
                let connectedWalletAddr = '0xbaF66C94CcD3daF358BB2084bDa7Ee10B0c8fb8b' // address 1
                let retResponse:any = await fetchStringBalance (connectedWalletAddr, tokenAddr, chainId)
                // console.debug("retResponse = " + JSON.stringify(retResponse))
                // alert(JSON.stringify(retResponse,null,2))
                let td:TokenElement = {
                    chainId: chainId,
                    address: tokenInput,
                    symbol: retResponse.symbol,
                    img: '/resources/images/miscellaneous/QuestionWhiteOnRed.png',
                    name: '',
                    decimals: retResponse.decimals
                }
                setTokenElement(td);
                return true
            }
       // return ELEMENT_DETAILS
        } catch (e:any) {
            alert("ERROR:setTokenDetails e.message" + e.message)
        }
        return false
    }

    const displayElementDetail = async(tokenAddr:any) => {
        let x = setTokenDetails(tokenAddr)
         if (!(await setTokenDetails(tokenAddr))) {
            alert("*** ERROR *** Invalid Token Address: " + tokenInput + "\n\n" + ELEMENT_DETAILS)
            return false
        }
        alert("displayElementDetail\n" + JSON.stringify(tokenElement, null, 2) + "\n\n" + ELEMENT_DETAILS)
        return true
    }

    const getSelectedListElement = (listElement: TokenElement | undefined) => {
        // alert("getSelectedListElement: " +JSON.stringify(listElement,null,2))
        if (listElement === undefined) {
            alert("Invalid Token address : " + tokenInput)
            return false;
        }
        if (listElement.address === sellTokenElement.address) {
            alert("Sell Token cannot be the same as Buy Token("+sellTokenElement.symbol+")")
            console.log("Sell Token cannot be the same as Buy Token("+sellTokenElement.symbol+")");
            return false;
        }
        callBackSetter(listElement)
        closeDialog()
    }

    const closeDialog = () => {
        setTokenInput("")
        setTokenSelect("");
        hideElement('buySelectGroup')
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

            <div className={styles.modalBox} >
                <div className={styles.modalElementSelect}>
                    <div className={styles.leftH}>
                        <Image src={searchMagGlassGrey_png} className={styles.searchImage} alt="Search Image Grey" />
                        <input id="tokenInput" className={styles.modalElementSelect} autoComplete="off" placeholder={INPUT_PLACE_HOLDER} onChange={setTokenInputField} value={tokenInput}/>
                        &nbsp;
                    </div>
                </div>
                    <div id="buySelectGroup" className={styles.modalInputSelect}>
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
                    <DataList dataFeedType={FEED.TOKEN_LIST} getSelectedListElement={getSelectedListElement}/>
                </div>
            </div>
        </dialog>
    )
    return Dialog
}
