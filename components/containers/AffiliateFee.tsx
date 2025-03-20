import PriceResponse from '@/lib/0X/typesV1';
import { useBuyTokenContract } from '@/lib/context/contextHooks';
import { TokenContract } from '@/lib/structure/types';
import { formatUnits } from 'ethers';
import React from 'react';
const AFFILIATE_FEE:any = process.env.NEXT_PUBLIC_AFFILIATE_FEE === undefined ? "0" : process.env.NEXT_PUBLIC_AFFILIATE_FEE

type Props = {
    priceResponse: PriceResponse | undefined 
}

const AffiliateFee = ({ priceResponse }: Props) => {
    const [buyTokenContract, setBuyTokenContract] = useBuyTokenContract();
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
