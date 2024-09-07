"use client"
import { useRef } from 'react';
import styles from './Resources/styles/Modal.module.css';
import Slippage from '../Popover/Slippage';

type Props = {
    slippage:number,
    setSlippageCallback: () => void
}

export default function Dialog({slippage, setSlippageCallback}:Props) {
    const dialogRef = useRef<null | HTMLDialogElement>(null)
    // 
    // const [errorMessage, setErrorMessage] = uuseState<ErrorMessage>({source:"", errCode:0, msg:""});

    // useEffect(() => {
    //     alert(JSON.stringify(errorMessage,null,2))
    // },[errorMessage])
  
    const closeDialog = () => {
        dialogRef.current?.close();
    }

    const Dialog = (
        <dialog id="configDialog" ref={dialogRef} className={styles.popupContainer}>
            <div className="flex flex-row justify-between mb-1 pt-0 px-3 text-white">
                <h1 className="text-md indent-39 mt-1 text-bg-txt-ltgry">Settings</h1>
                <div className="cursor-pointer rounded border-none w-5 text-xl text-bg-txt-ltgry"
                    onClick={closeDialog}
                >X</div>
            </div>
            <div >
                <div className={styles.modalScrollBar}>
                <Slippage initialSlippage={slippage} setSlippageCallback={setSlippageCallback}/>
                    <h1>{slippage}</h1>
                </div>
            </div>
        </dialog>
    )
    return Dialog
}
