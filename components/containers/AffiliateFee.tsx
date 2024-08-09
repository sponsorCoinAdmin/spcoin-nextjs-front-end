import { PriceResponse } from '@/app/api/types';
import { TokenContract } from '@/lib/structure/types';
import { formatUnits } from 'ethers';
import React from 'react';
const AFFILIATE_FEE:any = process.env.NEXT_PUBLIC_AFFILIATE_FEE === undefined ? "0" : process.env.NEXT_PUBLIC_AFFILIATE_FEE

type Props = {
    price: PriceResponse | undefined,
    buyTokenContract: TokenContract | undefined, 
}

const AffiliateFee = ({price, buyTokenContract} : Props) => {
    return (
        <div className="text-slate-400">
            {price && price.grossBuyAmount
            ? "Affiliate Fee: " +
            Number(formatUnits(BigInt(price.grossBuyAmount), buyTokenContract?.decimals)) *
            AFFILIATE_FEE + " " + buyTokenContract?.symbol
            : null}
        </div>
    );
}

export default AffiliateFee;
