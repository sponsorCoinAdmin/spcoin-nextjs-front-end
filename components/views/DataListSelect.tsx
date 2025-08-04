// File: components/views/DataListSelect.tsx
'use client';
import { JUNK_ALERTS } from '@/lib/utils/JUNK_ALERTS';

import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import info_png from '@/public/assets/miscellaneous/info1.png';
import { useChainId } from 'wagmi';
import {
  BASE, ETHEREUM, FEED_TYPE, HARDHAT, POLYGON, SEPOLIA, WalletAccount,
} from '@/lib/structure';
import { defaultMissingImage, getLogoURL } from '@/lib/network/utils';
import baseTokenList from '@/resources/data/networks/base/tokenList.json';
import hardhatTokenList from '@/resources/data/networks/hardhat/tokenList.json';
import polygonTokenList from '@/resources/data/networks/polygon/tokenList.json';
import sepoliaTokenList from '@/resources/data/networks/sepolia/tokenList.json';
import ethereumTokenList from '@/resources/data/networks/ethereum/tokenList.json';
import { Address } from 'viem';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { loadAccounts } from '@/lib/spCoin/loadAccounts';
import recipientJsonList from '@/resources/data/recipients/recipientJsonList.json';
import agentJsonList from '@/resources/data/agents/agentJsonList.json';
import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/useSharedPanelContext';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_DATA_LIST === 'true';
const debugLog = createDebugLogger('DataListSelect', DEBUG_ENABLED, LOG_TIME);

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

interface DataListProps<T> {
  dataFeedType: FEED_TYPE.TOKEN_LIST | FEED_TYPE.RECIPIENT_ACCOUNTS | FEED_TYPE.AGENT_ACCOUNTS;
}

export default function DataListSelect<T>({ dataFeedType }: DataListProps<T>) {
  const [isClient, setIsClient] = useState(false);
  const [wallets, setWallets] = useState<WalletAccount[]>([]);
  const [loadingWallets, setLoadingWallets] = useState(false);

  const { handleHexInputChange, setManualEntry } = useSharedPanelContext();
  const chainId = useChainId();

  useEffect(() => setIsClient(true), []);

  useEffect(() => {
    if (dataFeedType === FEED_TYPE.RECIPIENT_ACCOUNTS || dataFeedType === FEED_TYPE.AGENT_ACCOUNTS) {
      setLoadingWallets(true);
      const jsonList = dataFeedType === FEED_TYPE.RECIPIENT_ACCOUNTS ? recipientJsonList : agentJsonList;

      loadAccounts(jsonList)
        .then((accounts) => {
          debugLog.log(`✅ Accounts loaded: ${accounts.length}`);
          setWallets(accounts.map((account) => ({
            ...account,
            name: account.name || 'N/A',
            symbol: account.symbol || 'N/A',
            logoURL: account.logoURL || `/assets/accounts/${account.address}/logo.png`,
            address: account.address || '0x0000000000000000000000000000000000000000',
          })));
        })
        .catch((err) => debugLog.error('❌ Failed to load accounts', err))
        .finally(() => setLoadingWallets(false));
    }
  }, [dataFeedType]);

  const dataFeedList = useMemo(
    () => (isClient && dataFeedType === FEED_TYPE.TOKEN_LIST ? getDataFeedList(chainId) : []),
    [chainId, isClient, dataFeedType]
  );

  const logoTokenList = useMemo(
    () => dataFeedList.map((token) => ({
      ...token,
      logoURL: getLogoURL(chainId, token.address as Address, dataFeedType),
    })),
    [dataFeedList, chainId, dataFeedType]
  );

  const wrapperClass =
    'flex flex-col flex-1 min-h-0 overflow-y-auto bg-[#243056] text-[#5981F3] rounded-[20px] p-2.5 box-border';

  const renderEmptyState = (message: string) => (
    <div className="flex flex-1 items-center justify-center">
      <p>{message}</p>
    </div>
  );

  return (
    <>
      <style jsx>{`
        #DataListWrapper {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        #DataListWrapper::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {!isClient
        ? renderEmptyState('Loading data...')
        : (
          <div id="DataListWrapper" className={wrapperClass}>
            {(dataFeedType === FEED_TYPE.RECIPIENT_ACCOUNTS || dataFeedType === FEED_TYPE.AGENT_ACCOUNTS)
              ? (loadingWallets
                ? renderEmptyState('Loading accounts...')
                : (wallets.length === 0
                  ? renderEmptyState('No accounts available.')
                  : wallets.map((wallet) => (
                    <div
                      key={wallet.address}
                      className="flex justify-between mb-1 pt-2 px-5 hover:bg-spCoin_Blue-900 cursor-pointer"
                      onClick={() => {
                        debugLog.log(`🟢 Account clicked: ${wallet.name} → ${wallet.address}`);
                        JUNK_ALERTS(`DataListSelest Wallet.address:${wallet.address} → Setting manualEntry to false`)
                        setManualEntry(false);
                        const result = handleHexInputChange(wallet.address);
                        debugLog.log(`🛠️ handleHexInputChange returned:`, result);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <img className="h-8 w-8 object-contain rounded-full" src={wallet.logoURL || defaultMissingImage} alt={`${wallet.name} logo`} />
                        <div>
                          <div className="font-semibold">{wallet.name}</div>
                          <div className="text-sm text-gray-400">{wallet.symbol}</div>
                        </div>
                      </div>
                      <div
                        className="py-3 cursor-pointer rounded w-8 h-8 text-lg font-bold text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          JUNK_ALERTS(`Wallet JSON:\n${JSON.stringify(wallet, null, 2)}`);
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          JUNK_ALERTS(`${wallet.name} Record: ${stringifyBigInt(wallet.logoURL || '')}`);
                        }}
                      >
                        <Image src={info_png} alt="Info" width={20} height={20} />
                      </div>
                    </div>
                  ))
                )
              )
              : (logoTokenList.length === 0
                ? renderEmptyState('No tokens available.')
                : logoTokenList.map((token) => (
                  <div
                    key={token.address}
                    className="flex justify-between mb-1 pt-2 px-5 hover:bg-spCoin_Blue-900 cursor-pointer"
                    onClick={() => {
                      debugLog.log(`🟢 Token clicked: ${token.name} → ${token.address}`);
                      // JUNK_ALERTS(`DataListSelest Token.address:${token.address} → Setting manualEntry to false`)
                      setManualEntry(false);
                      const result = handleHexInputChange(token.address);
                      debugLog.log(`🛠️ handleHexInputChange returned:`, result);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <img className="h-8 w-8 object-contain rounded-full" src={token.logoURL || defaultMissingImage} alt={`${token.name} logo`} />
                      <div>
                        <div className="font-semibold">{token.name}</div>
                        <div className="text-sm text-gray-400">{token.symbol}</div>
                      </div>
                    </div>
                    <div
                      className="py-3 cursor-pointer rounded w-8 h-8 text-lg font-bold text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        JUNK_ALERTS(`${token.name} Address: ${stringifyBigInt(token)}`);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        JUNK_ALERTS(`${token.name} Record: ${token.logoURL}`);
                      }}
                    >
                      <Image src={info_png} alt="Info" width={20} height={20} />
                    </div>
                  </div>
                ))
              )
            }
          </div>
        )
      }
    </>
  );
}
