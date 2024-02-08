"use client"
import './Resources/Styles/modal.css';
import { useEffect, useRef, useState } from 'react'
import styles from './Resources/styles/Modal.module.css';
import DataList from './Resources/DataList'
import FEED  from '../../resources/data/feeds/feedTypes';
import { fetchBigIntBalance, fetchStringBalance } from '../../lib/wagmi/api/fetchBalance'
import searchMagGlassGrey_png from '../../../public/resources/images/SearchMagGlassGrey.png'
import customUnknownToken_png from '../../../public/resources/images/agents/QuestionWhiteOnRed.png'
import info_png from '../../../public/resources/images/info1.png'
import Image from 'next/image'
import { TokenElement } from '@/app/lib/structure/types';
import { isAddress } from 'ethers'; // ethers v6

const TITLE_NAME = "Select a token to sell";
const INPUT_PLACE_HOLDER = 'Type or paste token address';
const ELEMENT_DETAILS = "This container allows the entry of a valid token address For trading \n"+
    "when the address entry is completed and selected.\n"+
    "This address will be verified prior to entry acceptance.\n"+
    "Currently, there is no token lookup, but that is to come.\n"

const tokenDefault:TokenElement = {
    chainId: 0,
    symbol: "N/A/",
    img: "N/A/",
    name: "N/A/",
    address: "N/A/",
    decimals: 0
    }

const displayElementDetail = (le: any) => {
        alert("displayElementDetail\n" + JSON.stringify(le, null, 2))
    }

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
export default function Dialog({ buyTokenElement, callBackSetter }: any) {
    const dialogRef = useRef<null | HTMLDialogElement>(null)
    const [tokenInput, setTokenInput] = useState("");
    const [tokenSelect, setTokenSelect] = useState("");
    const [tokenElement, setTokenElement] = useState<TokenElement>();
    const chainId = buyTokenElement.chainId;

    useEffect(() => {
        closeDialog();
      }, []);

    useEffect( () => {
        // alert("tokenInput Changed "+tokenInput)
        setTokenSelect(tokenInput);
        tokenInput === "" ? hideElement('tokenSelectGroup') : showElement('tokenSelectGroup')
        setTokenDetails(tokenInput)
            
    }, [tokenInput]);

    const setTokenInputField = (event:any) => {
        setTokenInput(event.target.value)
    }

    const setTokenDetails = async(tokenAddr:any) => {
        try {
            if (isAddress(tokenInput)) {
                let connectedWalletAddr = '0xbaF66C94CcD3daF358BB2084bDa7Ee10B0c8fb8b' // address 1
                // let tokenAddr = '0x6B175474E89094C44Da98b954EedeAC495271d0F' //DAI
                let retResponse:any = await fetchStringBalance (connectedWalletAddr, tokenAddr, chainId)
                // console.debug("retResponse = " + JSON.stringify(retResponse))
                // alert(JSON.stringify(retResponse,null,2))
                let td:TokenElement = {
                    chainId: chainId,
                    address: tokenInput,
                    symbol: retResponse.symbol,
                    img: '/resources/images/agents/QuestionWhiteOnRed.png',
                    name: '',
                    decimals: retResponse.decimals
                }
                setTokenElement(td);
            }
        // return ELEMENT_DETAILS
        } catch (e:any) {
            alert("ERROR:setTokenDetails e.message" + e.message)
        }
    }

    const getSelectedListElement = (listElement: any) => {
        // alert("getSelectedListElement: " +JSON.stringify(listElement,null,2))
        if (listElement === undefined) {
            alert("Invalid Token address : " + tokenInput)
            return false;
        }
        if (listElement.address === buyTokenElement.address) {
            alert("Sell Token cannot be the same as Buy Token("+buyTokenElement.symbol+")")
            console.log("Sell Token cannot be the same as Buy Token("+buyTokenElement.symbol+")");
            return false;
        }
        callBackSetter(listElement)
        closeDialog()
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
                <div className="modalTokenSelect">
                    <div className={styles.leftH}>
                        <Image src={searchMagGlassGrey_png} className={styles.searchImage} alt="Search Image Grey" />
                        <input id="tokenInput" className={styles.modalTokenSelect} autoComplete="off" placeholder={INPUT_PLACE_HOLDER} onChange={setTokenInputField} value={tokenInput}/>
                    </div>
                </div>
                    <div id="tokenSelectGroup" className="modalInputSelect">
                    <div className="flex flex-row justify-between mb-1 pt-2 px-5 hover:bg-spCoin_Blue-900" >
                        <div className="cursor-pointer flex flex-row justify-between" onClick={() => getSelectedListElement(tokenElement)} >
                            <Image id="tokenImage" src={customUnknownToken_png} className={styles.searchImage} alt="Search Image Grey" />
                            <div>
                                <div className={styles.tokenName}>{tokenSelect}</div>
                                <div className={styles.tokenSymbol}>{"User Specified Token Address"}</div> 
                            </div>
                        </div>
                        <div className="py-3 cursor-pointer rounded border-none w-8 h-8 text-lg font-bold text-white"  onClick={() => displayElementDetail(tokenElement)}>
                       {/* <div className="py-3 cursor-pointer rounded border-none w-8 h-8 text-lg font-bold text-white"  onClick={() => alert(ELEMENT_DETAILS)}> */}
                            <Image src={info_png} className={styles.infoLogo} alt="Info Image" />
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
