"use client"
import styles from '@/styles/Modal.module.css';
import { useEffect, useRef, useState } from 'react'
import { getWagmiBalanceOfRec } from '@/lib/wagmi/getWagmiBalanceOfRec'
import searchMagGlassGrey_png from '@/public/resources/images/SearchMagGlassGrey.png'
import customUnknownImage_png from '@/public/resources/images/miscellaneous/QuestionWhiteOnRed.png'
import info_png from '@/public/resources/images/info1.png'
import Image from 'next/image'
import { FEED_TYPE, TokenContract } from '@/lib/structure/types';
import { isAddress } from 'ethers'; // ethers v6
import { hideElement, showElement } from '@/lib/spCoin/guiControl';
import { getTokenDetails } from '@/lib/spCoin/utils';
import DataList from './Resources/DataList';
import { BURN_ADDRESS } from '@/lib/network/utils';
import { useAccount } from 'wagmi';

const TITLE_NAME = "Select a token to buy";
const INPUT_PLACE_HOLDER = 'Manage Sponsorships';
const ELEMENT_DETAILS = "This container allows for the entry selection of a valid token address.\n"+
    "When the address entry is completed and selected, "+
    "this address will be verified prior to entry acceptance.\n"+
    "Currently, there is no image token lookup, but that is to come."

// ToDo Read in data List remotely

type Props = {
    tokenContract: TokenContract,
    callBackSetter: (listElement:TokenContract) => null,
    showDialog:boolean
}

export default function Dialog({showDialog, tokenContract, callBackSetter }: Props) {
    const ACTIVE_ACCOUNT = useAccount();
    const dialogRef = useRef<null | HTMLDialogElement>(null)
    const [tokenInput, setTokenInput] = useState("");
    const [tokenSelect, setTokenSelect] = useState("");
    const [TokenContract, setTokenContract] = useState<TokenContract| undefined>();
    const chainId = ACTIVE_ACCOUNT.chainId;

    useEffect(() => {
        closeDialog();
    }, []);

    useEffect(() => {
        showDialog ? dialogRef.current?.showModal() : dialogRef.current?.close()
    }, [showDialog])

    useEffect( () => {
        // alert("tokenInput Changed "+tokenInput)
        tokenInput === "" ? hideElement('buySelectGroup_ID') : showElement('buySelectGroup_ID')
        if (isAddress(tokenInput)) {
            setTokenDetails(tokenInput, setTokenContract)
        }
        else
            setTokenSelect("Invalid Token Address");
    }, [tokenInput]);

    useEffect( () => {
        // alert("TokenContract Changed "+tokenInput)
        if (TokenContract?.symbol != undefined)
            setTokenSelect(TokenContract.symbol);
    }, [TokenContract]);
    
    const setTokenInputField = (event:any) => {
        setTokenInput(event.target.value)
    }

    const setTokenDetails = async(tokenAddr: any, setTokenContract:any) => {
        return getTokenDetails(chainId, tokenAddr, setTokenContract)
    }

    const displayElementDetail = async(tokenAddr:any) => {
        try {
            if (!(await setTokenDetails(tokenAddr, setTokenContract))) {
                alert("*** ERROR *** Invalid Buy Token Address: " + tokenInput + "\n\n" + ELEMENT_DETAILS)
                return false
            }
            alert("displayElementDetail\n" + JSON.stringify(TokenContract, null, 2) + "\n\n" + ELEMENT_DETAILS)
            // Validate Token through wagmi get balance call
            await getWagmiBalanceOfRec (tokenAddr)
            return true
        } catch (e:any) {
            alert("BUY_ERROR:displayElementDetail e.message" + e.message)
        }
        return false
    }

    const getSelectedListElement = async (listElement: TokenContract | undefined) => {
        // alert("getSelectedListElement: " +JSON.stringify(listElement,null,2))
        try {
            if (listElement === undefined) {
                alert("Undefined Token address")
                return false;
            }
            if (!isAddress(listElement.address)) {
                alert(`${listElement.name} has invalid token address : ${listElement.address}`)
                return false;
            }
            if (listElement.address === tokenContract.address) {
                alert("Buy Token cannot be the same as Sell Token("+tokenContract.symbol+")")
                console.log("Buy Token cannot be the same as Sell Token("+tokenContract.symbol+")");
                return false;
            }
            await getWagmiBalanceOfRec (tokenContract.address)
            callBackSetter(listElement)
            closeDialog()
        } catch (e:any) {
            alert("BUY_ERROR:getSelectedListElement e.message" + e.message)
        }
        return false
    }

    const closeDialog = () => {
        setTokenInput("")
        setTokenSelect("");
        hideElement('buySelectGroup_ID')
        dialogRef.current?.close()
    }

    const Dialog = (
        <dialog id="manageSponsorshipsDialog" ref={dialogRef} className={styles.modalContainer}>
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
                    <div id="buySelectGroup_ID" className={styles.modalInputSelect}>
                    <div className="flex flex-row justify-between mb-1 pt-2 px-5 hover:bg-spCoin_Blue-900" >
                        <div className="cursor-pointer flex flex-row justify-between" onClick={() => getSelectedListElement(TokenContract)} >
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
