// File: components/views/DataListSelect.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import info_png from '@/public/assets/miscellaneous/info1.png';
import { useChainId } from 'wagmi';
import {
  BASE, ETHEREUM, FEED_TYPE, HARDHAT,POLYGON, SEPOLIA, WalletAccount,
} from '@/lib/structure';
import { defaultMissingImage, getLogoURL } from '@/lib/network/utils';
import baseTokenList from '@/resources/data/networks/base/tokenList.json';
import hardhatTokenList from '@/resources/data/networks/hardhat/tokenList.json';
import polygonTokenList from '@/resources/data/networks/polygon/tokenList.json';
import sepoliaTokenList from '@/resources/data/networks/sepolia/tokenList.json';
import ethereumTokenList from '@/resources/data/networks/ethereum/tokenList.json';
import { Address } from 'viem';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { loadAccounts } from '@/lib/spCoin/loadAccounts';
import recipientJsonList from '@/resources/data/recipients/recipientJsonList.json';
import agentJsonList from '@/resources/data/agents/agentJsonList.json';
import { useAssetSelectionContext } from '@/lib/context/ScrollSelectPanels/useAssetSelectionContext';
import { useEnsureBoolWhen } from '@/lib/hooks/useSettledState';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { InputState } from '@/lib/structure/assetSelection';

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

  const { handleHexInputChange, setManualEntry, setInputState, manualEntry } = useAssetSelectionContext();
  const chainId = useChainId();

  // queue & enforcement for programmatic picks
  const pendingPickRef = useRef<string | null>(null);
  const [enforceProgrammatic, setEnforceProgrammatic] = useState(false);

  // only force manualEntry=false while we have a pending pick
  const programmaticReady = useEnsureBoolWhen([manualEntry, setManualEntry], false, enforceProgrammatic);

  useEffect(() => setIsClient(true), []);

  useEffect(() => {
    if (dataFeedType === FEED_TYPE.RECIPIENT_ACCOUNTS || dataFeedType === FEED_TYPE.AGENT_ACCOUNTS) {
      setLoadingWallets(true);
      const jsonList = dataFeedType === FEED_TYPE.RECIPIENT_ACCOUNTS ? recipientJsonList : agentJsonList;
      loadAccounts(jsonList)
        .then((accounts) => {
          setWallets(
            accounts.map((account) => ({
              ...account,
              name: account.name || 'N/A',
              symbol: account.symbol || 'N/A',
              logoURL: account.logoURL || `/assets/accounts/${account.address}/logo.png`,
              address: account.address || '0x0000000000000000000000000000000000000000',
            }))
          );
        })
        .catch((err) => debugLog.error('Failed to load accounts', err))
        .finally(() => setLoadingWallets(false));
    }
  }, [dataFeedType, debugLog]);

  // commit queued pick once manualEntry is false
  useEffect(() => {
    if (programmaticReady && pendingPickRef.current) {
      const addr = pendingPickRef.current;
      pendingPickRef.current = null;
      setEnforceProgrammatic(false);

      alert(`✅ Programmatic commit\nmanualEntry=false\naddress=${addr}`);
      setInputState(InputState.EMPTY_INPUT, 'DataListSelect (Programmatic commit)');
      handleHexInputChange(addr, false);
    }
  }, [programmaticReady, handleHexInputChange, setInputState]);

  const dataFeedList = useMemo(
    () => (isClient && dataFeedType === FEED_TYPE.TOKEN_LIST ? getDataFeedList(chainId) : []),
    [chainId, isClient, dataFeedType]
  );

  const logoTokenList = useMemo(
    () =>
      dataFeedList.map((token) => ({
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

  const handlePickAddress = (address: string) => {
    if (!programmaticReady) {
      pendingPickRef.current = address;
      setEnforceProgrammatic(true);
      // alert(`⏳ Queued pick until manualEntry=false\naddress=${address}`);
      return;
    }
    // alert(`⚡ Programmatic immediate manualEntry=false\naddress=${address}`);
    setInputState(InputState.EMPTY_INPUT, 'DataListSelect (Programmatic RECIPIENT_SELECT_PANELe)');
    handleHexInputChange(address, false);
  };

  return (
    <>
      <style jsx>{`
        #DataListWrapper { scrollbar-width: none; -ms-overflow-style: none; }
        #DataListWrapper::-webkit-scrollbar { display: none; }
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
                      onClick={() => handlePickAddress(wallet.address)}
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
                          alert(`Wallet JSON:\n${JSON.stringify(wallet, null, 2)}`);
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          alert(`${wallet.name} Record:\n${stringifyBigInt(wallet.logoURL || '')}`);
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
                    onClick={() => handlePickAddress(token.address)}
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
                        alert(`${token.name} Object:\n${stringifyBigInt(token)}`);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        alert(`${token.name} Logo URL: ${token.logoURL}`);
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
