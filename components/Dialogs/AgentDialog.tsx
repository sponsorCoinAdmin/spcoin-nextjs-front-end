"use client"
import styles from '@/styles/Modal.module.css';
import { useEffect, useRef, useState } from 'react'
import { getWagmiBalanceOfRec } from '@/lib/wagmi/getWagmiBalanceOfRec'
import searchMagGlassGrey_png from '@/public/assets/miscellaneous/SearchMagGlassGrey.png'
import customUnknownImage_png from '@/public/assets/miscellaneous/QuestionWhiteOnRed.png'
import info_png from '@/public/assets/miscellaneous/info1.png'
import Image from 'next/image'
import { FEED_TYPE, WalletAccount } from '@/lib/structure/types';
import { isAddress } from 'ethers'; // ethers v6
import DataList from './Resources/DataList';
import { hideElement, showElement } from '@/lib/spCoin/guiControl';

const TITLE_NAME = "Select an Agent";
const INPUT_PLACE_HOLDER = 'Type or paste agent wallet address';
const ELEMENT_DETAILS = "This container allows for the entry selection of a valid agent address.\n"+
    "When the address entry is completed and selected, "+
    "this address will be verified prior to entry acceptance.\n"+
    "Currently, there is no image token lookup, but that is to come."

// ToDo Read in data List remotely
type Props = {
    recipientWallet:any,
    callBackSetter: (agentAccount: WalletAccount) => void,
    showDialog:boolean
}

export default function Dialog({showDialog, recipientWallet, callBackSetter }: Props) {
    const dialogRef = useRef<null | HTMLDialogElement>(null)
    const [agentInput, setAgentInput] = useState("");
    const [walletSelect, setWalletSelect] = useState("");
    const [walletElement, setWalletElement] = useState<WalletAccount| undefined>();

    useEffect(() => {
        closeDialog();
    }, []);

    useEffect(() => {
        showDialog ? dialogRef.current?.showModal() : dialogRef.current?.close()
    }, [showDialog])

    useEffect( () => {
        // alert("agentInput Changed "+agentInput)
        agentInput === "" ? hideElement('agentSelectGroup_ID') : showElement('recipientContainerDiv_ID')
        if (isAddress(agentInput)) {
            setWalletDetails(agentInput)
        }
        else
            setWalletSelect("Invalid Wallet Address");
    }, [agentInput]);

    useEffect( () => {
        // alert("walletElement Changed "+agentInput)
        if (walletElement?.symbol != undefined)
            setWalletSelect(walletElement.symbol);
    }, [walletElement]);
    

    const setAgentInputField = (event:any) => {
        setAgentInput(event.target.value)
    }

    const setWalletDetails = async(walletAddr:any) => {
        try {
            if (isAddress(walletAddr)) {
                let retResponse:any = await getWagmiBalanceOfRec (walletAddr)
                // console.debug("retResponse = " + JSON.stringify(retResponse))
                // alert(JSON.stringify(retResponse,null,2))
                let td:WalletAccount = {
                    address: agentInput,
                    symbol: retResponse.symbol,
                    img: '/assets/miscellaneous/QuestionWhiteOnRed.png',
                    name: '',
                    url: "ToDo Set This"
                }
                setWalletElement(td);
                return true
            }
       // return ELEMENT_DETAILS
        } catch (e:any) {
            alert("ERROR:setWalletDetails e.message" + e.message)
        }
        return false
    }

    const displayElementDetail = async(elementAddress:any) => {
        let x = setWalletDetails(elementAddress)
         if (!(await setWalletDetails(elementAddress))) {
            alert("*** ERROR *** Invalid Wallet Address: " + agentInput + "\n\n" + ELEMENT_DETAILS)
            return false
        }
        alert("displayElementDetail\n" + JSON.stringify(walletElement, null, 2) + "\n\n" + ELEMENT_DETAILS)
        return true
    }

    const getSelectedListElement = (listElement: WalletAccount | undefined) => {
        // alert("getSelectedListElement: " +JSON.stringify(listElement,null,2))
        if (listElement === undefined) {
            alert("Invalid Wallet address : " + agentInput)
            return false;
        }
        if (listElement.address === recipientWallet.address) {
            alert("Agent cannot be the same as Recipient("+recipientWallet.symbol+")")
            console.log("Agent cannot be the same as Recipient("+recipientWallet.symbol+")");
            return false;
        }
        callBackSetter(listElement)
        closeDialog()
    }

    const closeDialog = () => {
        setAgentInput("")
        setWalletSelect("");
        hideElement('recipientContainerDiv_ID')
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
                <div className={styles.modalElementSelect}>
                    <div className={styles.leftH}>
                        <Image src={searchMagGlassGrey_png} className={styles.searchImage} alt="Search Image Grey" />
                        <input id="agentInput" className={styles.modalElementSelect} autoComplete="off" placeholder={INPUT_PLACE_HOLDER} onChange={setAgentInputField} value={agentInput}/>
                        &nbsp;
                    </div>
                </div>
                <div id="agentContainerDiv_ID" className={styles.modalInputSelect}>
                    <div className="flex flex-row justify-between mb-1 pt-2 px-5 hover:bg-spCoin_Blue-900" >
                        <div className="cursor-pointer flex flex-row justify-between" onClick={() => getSelectedListElement(walletElement)} >
                            <Image id="walletImage" src={customUnknownImage_png} className={styles.elementLogo} alt="Search Image Grey" />
                            <div>
                                <div className={styles.elementName}>{walletSelect}</div>
                                <div className={styles.elementSymbol}>{"User Specified Wallet"}</div> 
                            </div>
                        </div>
                        <div className="py-3 cursor-pointer rounded border-none w-8 h-8 text-lg font-bold text-white"  onClick={() => displayElementDetail(agentInput)}>
                            <Image src={info_png} className={styles.infoLogo} alt="Info Image" />
                        </div>
                    </div>
                </div>
                <div className={styles.modalScrollBar}>
                    <DataList dataFeedType={FEED_TYPE.AGENT_WALLETS} updateTokenCallback={getSelectedListElement}/>
                </div>
            </div>
        </dialog>
    )
    return Dialog
}
