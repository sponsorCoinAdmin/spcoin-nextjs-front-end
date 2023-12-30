import React from 'react'
import styles from './styles/Modal.module.css'
import info_png from './Resources/images/info1.png'
import Image from 'next/image'

type ListElement = {
    chainId: number;
    symbol: string; 
    img: string; 
    name: string; 
    address: string; 
    decimals: number;
}

type Props = {
    dataList: ListElement[],
    selectElement: any,
    getSelectedListElement:  (listElement: ListElement) => void,
}

function displayElementDetail (le: ListElement) {
    alert("displayElementDetail\n" + JSON.stringify(le,null,2))
}

function DataList({dataList, selectElement, getSelectedListElement} : Props) {
    // alert("dataList = " + JSON.stringify(dataList,null,2));

    const tList = dataList?.map((e: ListElement, i: number) => (
        <div className="flex flex-row justify-between mb-1 pt-2 px-5 hover:bg-spCoin_Blue-900"  key={e.address}>
            <div className="cursor-pointer flex flex-row justify-between" onClick={() => getSelectedListElement(dataList[i])} >
                <img src={e.img} alt={e.symbol} className={styles.tokenLogo} />
                <div>
                    <div className={styles.tokenName}>{e.name}</div>
                    <div className={styles.tokenSymbol}>{e.symbol}</div> 
                </div>
            </div>
            <div className="py-3 cursor-pointer rounded border-none w-8 h-8 text-lg font-bold text-white"  onClick={() => displayElementDetail(dataList[i])}>
                <Image src={info_png} className={styles.infoLogo} alt="Info Image" />
            </div>
        </div>
    ))

    return (
        <div>
            {tList}
        </div>
    )
}


// export const POLYGON_TOKENS_BY_ADDRESS: Record<string, Token> = {

export default DataList
