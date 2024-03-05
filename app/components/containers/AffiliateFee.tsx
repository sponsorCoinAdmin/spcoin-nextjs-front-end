import { PriceResponse } from '@/app/api/types';
import { TokenElement } from '@/app/lib/structure/types';
import { formatUnits } from 'ethers';
import React from 'react';
const AFFILIATE_FEE:any = process.env.NEXT_PUBLIC_AFFILIATE_FEE === undefined ? "0" : process.env.NEXT_PUBLIC_AFFILIATE_FEE

type Props = {
    price: PriceResponse | undefined,
    sellTokenElement: TokenElement, 
    buyTokenElement: TokenElement, 
  }

const AffiliateFee = ({price, sellTokenElement, buyTokenElement} : Props) => {
    return (
        <div className="text-slate-400">
            {price && price.grossBuyAmount
            ? "Affiliate Fee: " +
            Number(formatUnits(BigInt(price.grossBuyAmount), buyTokenElement.decimals)) *
            AFFILIATE_FEE + " " + buyTokenElement.symbol
            : null}
        </div>
    );
}

export default AffiliateFee;
