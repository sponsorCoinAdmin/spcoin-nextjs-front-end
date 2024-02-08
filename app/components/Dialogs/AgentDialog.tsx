"use client"
import styles from './Resources/styles/Modal.module.css';
import { useEffect, useRef, useState } from 'react'
import DataList from './Resources/DataList'
import FEED  from '../../resources/data/feeds/feedTypes';
import { fetchStringBalance } from '../../lib/wagmi/api/fetchBalance'
import searchMagGlassGrey_png from '../../../public/resources/images/SearchMagGlassGrey.png'
import customUnknownImage_png from '../../../public/resources/images/agents/QuestionWhiteOnRed.png'
import info_png from '../../../public/resources/images/info1.png'
import Image from 'next/image'
import { TokenElement } from '@/app/lib/structure/types';
import { isAddress } from 'ethers'; // ethers v6

const TITLE_NAME = "Select an Agent";
const INPUT_PLACE_HOLDER = 'Type or paste agent wallet address';
const ELEMENT_DETAILS = "This container allows the entry of a valid agent wallet address For trading \n"+
    "when the address entry is completed and selected.\n"+
    "This address will be verified prior to entry acceptance.\n"+
    "Currently, there is no agent image lookup, but that is to come."

const hideElement = (element:any) => {
    const el = document.getElementById(element);
    console.debug("BEFORE display = " + el?.style.display)
    console.debug("hideElement(" + element +")")
    if (el != null) {
        el.style.display = 'none'
    }
    console.debug("AFTER display = " + el?.style.display)
}

const showElement = (element:any) => {
    const el = document.getElementById(element);
    console.debug("showElement(" + element +")")
    if (el != null) {
        el.style.display = 'block'
    }
}

// ToDo Read in data List remotely
export default function Dialog({ recipientElement, callBackSetter }: any) {
    const dialogRef = useRef<null | HTMLDialogElement>(null)
    const [agentInput, setAgentInput] = useState("");
    const [agentSelect, setAgentSelect] = useState("");
    const [tokenElement, setTokenElement] = useState<TokenElement| undefined>();

    useEffect(() => {
        closeDialog();
    }, []);

    useEffect( () => {
        // alert("agentInput Changed "+agentInput)
        agentInput === "" ? hideElement('agentSelectGroup') : showElement('agentSelectGroup')
        if (isAddress(agentInput)) {
            setTokenDetails(agentInput)
        }
        else
            setAgentSelect("Invalid Wallet Address");
    }, [agentInput]);

    useEffect( () => {
        // alert("tokenElement Changed "+agentInput)
        if (tokenElement?.symbol != undefined)
            setAgentSelect(tokenElement.symbol);
    }, [tokenElement]);
    

    const setAgentInputField = (event:any) => {
        setAgentInput(event.target.value)
    }

    const setTokenDetails = async(tokenAddr:any) => {
        try {
            let chainId=1;
            if (isAddress(tokenAddr)) {
                let connectedWalletAddr = '0xbaF66C94CcD3daF358BB2084bDa7Ee10B0c8fb8b' // address 1
                // let tokenAddr = '0x6B175474E89094C44Da98b954EedeAC495271d0F' //DAI
                let retResponse:any = await fetchStringBalance (connectedWalletAddr, tokenAddr, chainId)
                // console.debug("retResponse = " + JSON.stringify(retResponse))
                // alert(JSON.stringify(retResponse,null,2))
                let td:TokenElement = {
                    chainId: chainId,
                    address: agentInput,
                    symbol: retResponse.symbol,
                    img: '/resources/images/agents/QuestionWhiteOnRed.png',
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

    const displayTokenDetail = async(tokenAddr:any) => {
        let x = setTokenDetails(tokenAddr)
         if (!(await setTokenDetails(tokenAddr))) {
            alert("*** ERROR *** Invalid Token Address: " + agentInput + "\n\n" + ELEMENT_DETAILS)
            return false
        }
        alert("displayTokenDetail\n" + JSON.stringify(tokenElement, null, 2) + "\n\n" + ELEMENT_DETAILS)
        return true
    }

    const getSelectedListElement = (listElement: TokenElement | undefined) => {
        // alert("getSelectedListElement: " +JSON.stringify(listElement,null,2))
        if (listElement === undefined) {
            alert("Invalid Token address : " + agentInput)
            return false;
        }
        if (listElement.address === recipientElement.address) {
            alert("Agent cannot be the same as Recipient("+recipientElement.symbol+")")
            console.log("Agent cannot be the same as Recipient("+recipientElement.symbol+")");
            return false;
        }
        callBackSetter(listElement)
        closeDialog()
    }

    const closeDialog = () => {
        setAgentInput("")
        setAgentSelect("");
        hideElement('agentSelectGroup')
        dialogRef.current?.close()
    }

    const Dialog = (
        <dialog id="agentDialog" ref={dialogRef} className={styles.modalContainer}>
            <div className="flex flex-row justify-between mb-1 pt-0 px-3 text-gray-600">
                <h1 className="text-sm indent-9 mt-1">{TITLE_NAME}</h1>
                <div className="cursor-pointer rounded border-none w-5 text-xl text-white"
                    onClick={closeDialog}
                >X</div>
            </div>

            <div className={styles.modalBox} >
                <div className={styles.modalAgentSelect}>
                    <div className={styles.leftH}>
                        <Image src={searchMagGlassGrey_png} className={styles.searchImage} alt="Search Image Grey" />
                        <input id="agentInput" className={styles.modalAgentSelect} autoComplete="off" placeholder={INPUT_PLACE_HOLDER} onChange={setAgentInputField} value={agentInput}/>
                        &nbsp;
                    </div>
                </div>
                    <div id="agentSelectGroup" className={styles.modalInputSelect}>
                    <div className="flex flex-row justify-between mb-1 pt-2 px-5 hover:bg-spCoin_Blue-900" >
                        <div className="cursor-pointer flex flex-row justify-between" onClick={() => getSelectedListElement(tokenElement)} >
                            <Image id="tokenImage" src={customUnknownImage_png} className={styles.tokenLogo} alt="Search Image Grey" />
                            <div>
                                <div className={styles.tokenName}>{agentSelect}</div>
                                <div className={styles.tokenSymbol}>{"User Specified Token"}</div> 
                            </div>
                        </div>
                        <div className="py-3 cursor-pointer rounded border-none w-8 h-8 text-lg font-bold text-white"  onClick={() => displayTokenDetail(agentInput)}>
                            <Image src={info_png} className={styles.infoLogo} alt="Info Image" />
                        </div>
                    </div>
                </div>
                <div className={styles.modalScrollBar}>
                    <DataList dataFeedType={FEED.AGENT_WALLETS} getSelectedListElement={getSelectedListElement}/>
                </div>
            </div>
        </dialog>
    )
    return Dialog
}
