'use client'

import React, { useEffect, useState } from "react";
import { config } from '@/lib/wagmi/wagmiConfig';
import spCoin_png from '@/public/assets/miscellaneous/spCoin.png';
import Image from 'next/image';
import Link from 'next/link';
import ConnectButton from "../Buttons/ConnectButton";
import { defaultMissingImage, getBlockChainName, getBlockChainLogoURL } from "@/lib/network/utils";
import { useChainId } from "wagmi";

export default function Header() {
  const [networkName, setNetworkName] = useState<string>("Ethereum");
  const chainId = useChainId({ config });
  const [avatar, setAvatar] = useState<string>(getBlockChainLogoURL(chainId));

  const SHOW_TEST_LINK = process.env.NEXT_PUBLIC_DEBUG_TEST_PAGE_ON === 'true';

  useEffect(() => {
    const network = getBlockChainName(chainId) || "";
    setAvatar(getBlockChainLogoURL(chainId));
    setNetworkName(network);
  }, [chainId]);

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-[#0E111B] text-white border-b border-[#21273a]">
      {/* Left side nav */}
      <div className="flex items-center gap-5">
        <Image
          src={spCoin_png}
          width={25}
          height={25}
          alt="Sponsor Coin Logo"
        />
        <Link href="/SponsorCoin" className="hover:text-[#5981F3]">SponsorCoin</Link>
        <Link href="/Exchange" className="hover:text-[#5981F3]">Exchange</Link>
        <Link href="/Recipient" className="hover:text-[#5981F3]">Recipient</Link>
        <Link href="/Admin" className="hover:text-[#5981F3]">Admin</Link>
        {SHOW_TEST_LINK && (
          <Link href="/Exchange/Test" className="hover:text-[#5981F3]">Test</Link>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <img
            src={avatar}
            className="h-[25px] w-[25px]"
            alt={`Header ChainId = ${chainId} Network = ${networkName}`}
            onError={(event) => {
              event.currentTarget.src = defaultMissingImage;
            }}
          />
          <span>{networkName}</span>
        </div>
        <ConnectButton />
      </div>
    </header>
  );
}
