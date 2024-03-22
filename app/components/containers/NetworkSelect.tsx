import React, { useEffect } from 'react';
import styles from '@/app/styles/Exchange.module.css';
import { openDialog } from '../Dialogs/Dialogs';
import { DownOutlined } from "@ant-design/icons";
import { NetworkElement } from '@/app/lib/structure/types';
import { hideElement, showElement, toggleElement } from '@/app/lib/spCoin/guiControl';

type Props = {
    networkElement: NetworkElement, 
    id: string,
    disabled: boolean
    // setSellAmount: (txt: string) => void|undefined,
  }

const NetworkSelect = ({networkElement, id, disabled}:Props) => {
    let selectId = id + "Select"
    useEffect(() => {
        if (disabled) {
            console.debug(`disabled = ${disabled} hideElement(${selectId})`)
            hideElement(selectId)
        } else {
            console.debug(`disabled = ${disabled} showElement(${selectId})`)
            showElement(selectId)
        }
    },[]);

    // alert(`networkElement = ${JSON.stringify(networkElement,null,2)}`)
  
    return (
        <div>
            <div className={styles["dropdown-content"]}>
                <div className={styles["networkSelect"]}>
                    <img alt={networkElement.name} className="h-9 w-9 mr-2 rounded-md cursor-pointer" src={networkElement.img} onClick={() => alert("networkElement " + JSON.stringify(networkElement,null,2))}/>
                    {networkElement.name}
                    {/* <DownOutlined id={selectId} onClick={() => openDialog("#"+id)}/> */}
                    <DownOutlined id={selectId} onClick={() => toggleElement("networks")}/>
                </div>
                <div id="networks" className={styles["networks"]}>
                    <div className={styles["networkSelect"]}>
                        <img alt={networkElement.name} className="h-9 w-9 mr-2 rounded-md cursor-pointer" src={networkElement.img} onClick={() => alert("networkElement " + JSON.stringify(networkElement,null,2))}/>
                            <h1 onClick={() => alert("AAA networkElement " + JSON.stringify(networkElement,null,2))} >Link 1</h1>
                    </div>
                    <div className={styles["networkSelect"]}>
                        <img alt={networkElement.name} className="h-9 w-9 mr-2 rounded-md cursor-pointer" src={networkElement.img} onClick={() => alert("networkElement " + JSON.stringify(networkElement,null,2))}/>
                            Link 2
                    </div>
                    <div className={styles["networkSelect"]}>
                        <img alt={networkElement.name} className="h-9 w-9 mr-2 rounded-md cursor-pointer" src={networkElement.img} onClick={() => alert("networkElement " + JSON.stringify(networkElement,null,2))}/>
                            Link 3
                    </div>
                    <div className={styles["networkSelect"]}>
                        <img alt={networkElement.name} className="h-9 w-9 mr-2 rounded-md cursor-pointer" src={networkElement.img} onClick={() => alert("networkElement " + JSON.stringify(networkElement,null,2))}/>
                            Link 4
                    </div>
                </div>
             </div>
       </div>
    );
}

export default NetworkSelect;
