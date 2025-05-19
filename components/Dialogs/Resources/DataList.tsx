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
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME: boolean = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_DATA_LIST === 'true';
const debugLog = createDebugLogger('DataList', DEBUG_ENABLED, LOG_TIME);

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

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (status === 'disconnected') {
    debugLog.warn('Current chainId:', chainId, 'Connection status:', status);
  }

  const dataFeedList = useMemo(() => {
    return isClient ? getDataFeedList(chainId) : [];
  }, [chainId, isClient]);

  const logoTokenList = useMemo(() => {
    return dataFeedList.map((token) => ({
      ...token,
      logoURL: getLogoURL(chainId, token.address as Address, FEED_TYPE.TOKEN_LIST),
    }));
  }, [dataFeedList]);

  if (!isClient) {
    return <p>Loading data...</p>;
  }

  return (
    <>
      {logoTokenList.length === 0 ? (
        <p>No data available.</p>
      ) : (
        logoTokenList.map((token) => (
          <div
            key={token.address}
            className="flex flex-row justify-between mb-1 pt-2 px-5 hover:bg-spCoin_Blue-900"
            onClick={() => {
              if (!token?.address) return;
              debugLog.log(`[DataList] Token selected: ${token.address}`);
              onTokenSelect(token.address);
            }}
          >
            <div className="cursor-pointer flex flex-row justify-between">
              <img
                className={styles.elementLogo}
                src={token.logoURL || defaultMissingImage}
                alt={`${token.name} Token logoURL`}
              />
              <div>
                <div className={styles.elementName}>{token.name}</div>
                <div className={styles.elementSymbol}>{token.symbol}</div>
              </div>
            </div>
            <div
              className="py-3 cursor-pointer rounded border-none w-8 h-8 text-lg font-bold text-white"
              onClick={(e) => {
                e.stopPropagation();
                alert(`${token.name} Address: ${token.address}`);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                alert(`${token.name} Record: ${stringifyBigInt(token.logoURL)}`);
              }}
            >
              <Image className={styles.infoLogo} src={info_png} alt="Info Image" />
            </div>
          </div>
        ))
      )}
    </>
  );
};

export default DataList;
