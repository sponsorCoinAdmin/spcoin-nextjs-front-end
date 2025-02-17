import { PriceResponse } from '@/app/api/0X/types';
import { TokenContract } from '@/lib/structure/types';
import { formatUnits } from 'ethers';
import React from 'react';
const AFFILIATE_FEE:any = process.env.NEXT_PUBLIC_AFFILIATE_FEE === undefined ? "0" : process.env.NEXT_PUBLIC_AFFILIATE_FEE

type Props = {
    priceResponse: PriceResponse | undefined,
    buyTokenContract: TokenContract | undefined, 
}

const AffiliateFee = ({priceResponse, buyTokenContract}:Props) => {
    return (
        <div className="text-slate-400">
            {priceResponse?.grossBuyAmount
            ? "Affiliate Fee: " +
            Number(formatUnits(BigInt(priceResponse.grossBuyAmount), buyTokenContract?.decimals)) *
            AFFILIATE_FEE + " " + buyTokenContract?.symbol
            : null}
        </div>
    );
}

export default AffiliateFee;
