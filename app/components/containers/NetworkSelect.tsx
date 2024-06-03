import React, { useEffect } from 'react';
import styles from '@/app/styles/Header.module.css';
import { openDialog } from '../Dialogs/Dialogs';
import { DownOutlined } from "@ant-design/icons";
import { NetworkElement } from '@/app/lib/structure/types';
import { hideElement, showElement, toggleElement } from '@/app/lib/spCoin/guiControl';
import networks from '@/lib/network/initialize/networks.json';
import Image from 'next/image'
import info_png from '../../../public/resources/images/info1.png'

type Props = {
    networkElement: NetworkElement, 
    id: string,
    disabled: boolean
    // setSellAmount: (txt: string) => void|undefined,
  }

const NetworkSelect = ({networkElement, id, disabled}:Props) => {

    let dataFeedList = networks;
    // alert(JSON.stringify(networks, null, 2))
    // console.debug("dataFeedList = \n" +JSON.stringify(dataFeedList,null,2))
    const tList = dataFeedList?.map((e: any, i: number) => (
        <div className="mb-1 mt-1 ml-1 mr-1 pt-1 px-0 hover:bg-spCoin_Blue-900"  key={e.chainId}>
            <div className={styles["networkSelect"]} onClick={() => alert(JSON.stringify(dataFeedList[i],null,2))} >
                <img src={e.img} alt={e.symbol} className="h-9 w-9 mr-2 rounded-md cursor-pointer" />
                <div>
                    <div>{e.name}</div>
                </div>
            </div>
            {/* <div className="py-3 cursor-pointer rounded border-none w-8 h-8 text-lg font-bold text-white"  onClick={() => alert(JSON.stringify(dataFeedList[i],null,2))}>
                <Image src={info_png} className={styles.infoLogo} alt="Info Image" />
            </div> */}
        </div>
    ))

    // alert(JSON.stringify(tList,null,2))

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
{/*                     
                    <div className={styles["networkSelect"]}>
                        <img alt={networkElement.name} className="h-9 w-9 mr-2 rounded-md cursor-pointer" src={networkElement.img} onClick={() => alert("networkElement " + JSON.stringify(networkElement,null,2))}/>
                            <h1 onClick={() => alert("AAA networkElement " + JSON.stringify(networkElement,null,2))} >Link 1</h1>
                    </div>
                    <div className={styles["networkSelect"]}>
                        <img alt={networkElement.name} className="h-9 w-9 mr-2 rounded-md cursor-pointer" src={networkElement.img} onClick={() => alert("networkElement " + JSON.stringify(networkElement,null,2))}/>
                            Link 2
                    </div>
                     */}
                    <div>{tList}</div>
                </div>
             </div>
       </div>
    );
}

export default NetworkSelect;
