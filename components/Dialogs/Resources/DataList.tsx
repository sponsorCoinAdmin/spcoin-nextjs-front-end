'use client';

import styles from '@/styles/Modal.module.css';
import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import info_png from '@/public/assets/miscellaneous/info1.png';
import { useAccount, useChainId } from 'wagmi';
import {
  BASE,
  ETHEREUM,
  FEED_TYPE,
  HARDHAT,
  POLYGON,
  SEPOLIA,
  TokenContract,
} from '@/lib/structure/types';
import {
  defaultMissingImage,
  getLogoURL,
} from '@/lib/network/utils';
import baseTokenList from '@/resources/data/networks/base/tokenList.json';
import hardhatTokenList from '@/resources/data/networks/hardhat/tokenList.json';
import polygonTokenList from '@/resources/data/networks/polygon/tokenList.json';
import sepoliaTokenList from '@/resources/data/networks/sepolia/tokenList.json';
import ethereumTokenList from '@/resources/data/networks/ethereum/tokenList.json';
import { Address } from 'viem';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';

const getDataFeedList = (chainId: number) => {
  switch (chainId) {
    case BASE: return baseTokenList;
    case ETHEREUM: return ethereumTokenList;
    case POLYGON: return polygonTokenList;
    case HARDHAT: return hardhatTokenList;
    case SEPOLIA: return sepoliaTokenList;
    default: return ethereumTokenList;
  }
};

interface DataListProps {
  onTokenSelect: (address: string) => void;
}

const DataList = ({ onTokenSelect }: DataListProps) => {
  const [isClient, setIsClient] = useState(false);
  const chainId = useChainId();
  const { status } = useAccount();
  console.log('Current chainId:', chainId, 'Connection status:', status);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const dataFeedList = useMemo(() => {
    return isClient ? getDataFeedList(chainId) : [];
  }, [chainId, isClient]);

  const LogoURL_List = useMemo(() => {
    return dataFeedList.map((listElement) => ({
      ...listElement,
      logoURL: getLogoURL(chainId, listElement.address as Address, FEED_TYPE.TOKEN_LIST),
    }));
  }, [dataFeedList]);

  if (!isClient) {
    return <p>Loading data...</p>;
  }

  return (
    <>
      {LogoURL_List.length === 0 ? (
        <p>No data available.</p>
      ) : (
        LogoURL_List.map((listElement, i) => {
          const token = dataFeedList[i] as TokenContract;
          return (
            <div
              key={listElement.address}
              className="flex flex-row justify-between mb-1 pt-2 px-5 hover:bg-spCoin_Blue-900"
              onClick={() => {
                console.log(`[DataList] Token selected: ${token.address}`);
                onTokenSelect(token.address); // ✅ Only pass the address now
              }}
            >
              <div className="cursor-pointer flex flex-row justify-between">
                <img
                  className={styles.elementLogo}
                  src={listElement.logoURL || defaultMissingImage}
                  alt={`${listElement.name} Token logoURL`}
                />
                <div>
                  <div className={styles.elementName}>{listElement.name}</div>
                  <div className={styles.elementSymbol}>{listElement.symbol}</div>
                </div>
              </div>
              <div
                className="py-3 cursor-pointer rounded border-none w-8 h-8 text-lg font-bold text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  alert(`${listElement.name} Address: ${listElement.address}`);
                }}
                onContextMenu={(e) => {
                  e.preventDefault(); // Prevents the default browser context menu
                  e.stopPropagation();
                  alert(`${listElement.name} Record: ${stringifyBigInt(listElement.logoURL)}`);
                }}
              >
                <Image className={styles.infoLogo} src={info_png} alt="Info Image" />
              </div>
            </div>
          );
        })
      )}
    </>
  );
};

export default DataList;
