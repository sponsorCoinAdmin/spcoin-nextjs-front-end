import React from 'react'
import Dialog from './TokenDialogList';
import dataList from './Resources/data/tokens/tokenPolyList.json';

type TokenElement = {
    chainId: number;
    symbol: string; 
    img: string; 
    name: string; 
    address: any; 
    decimals: number;
}

type Props = {
    selectElement: string,
    getDlgLstElement: (listElement: TokenElement) => boolean,
}

function TokenDialogList({ selectElement, getDlgLstElement}: Props) {
  return (
    <Dialog dataList={dataList} selectElement={selectElement} getDlgLstElement={getDlgLstElement}/>    
  )
}

export default TokenDialogList
