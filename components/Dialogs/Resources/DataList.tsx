// File: components/Dialogs/Resources/DataList.tsx

'use client';

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
  WalletAccount,
} from '@/lib/structure';
import {
  defaultMissingImage,
  getLogoURL,
} from '@/lib/network/utils';
import baseTokenList from '@/resources/data/networks/base/tokenList.json';
import hardhatTokenList from '@/resources/data/networks/hardhat/tokenList.json';
import polygonTokenList from '@/resources/data/networks/polygon/tokenList.json';
import sepoliaTokenList from '@/resources/data/networks/sepolia/tokenList.json';
import ethereumTokenList from '@/resources/data/networks/ethereum/tokenList.json';
import { Address, isAddress } from 'viem';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { loadAccounts } from '@/lib/spCoin/loadAccounts';
import recipientJsonList from '@/resources/data/recipients/recipientJsonList.json';
import agentJsonList from '@/resources/data/agents/agentJsonList.json';

const LOG_TIME = false;
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

interface DataListProps<T> {
  dataFeedType: FEED_TYPE.TOKEN_LIST | FEED_TYPE.RECIPIENT_ACCOUNTS | FEED_TYPE.AGENT_ACCOUNTS;
  onSelect: (entry: T) => void;
}

export default function DataList<T>({ dataFeedType, onSelect }: DataListProps<T>) {
  const [isClient, setIsClient] = useState(false);
  const [wallets, setWallets] = useState<WalletAccount[]>([]);
  const [loadingWallets, setLoadingWallets] = useState(false);

  const chainId = useChainId();
  const { status } = useAccount();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (dataFeedType === FEED_TYPE.RECIPIENT_ACCOUNTS || dataFeedType === FEED_TYPE.AGENT_ACCOUNTS) {
      setLoadingWallets(true);
      const jsonList =
        dataFeedType === FEED_TYPE.RECIPIENT_ACCOUNTS ? recipientJsonList : agentJsonList;

      loadAccounts(jsonList)
        .then((accounts) => {
          debugLog.log(`✅ Accounts loaded: ${accounts.length}`);
          const sanitized = accounts.map((account) => ({
            ...account,
            name: account.name || 'N/A',
            symbol: account.symbol || 'N/A',
            logoURL: account.logoURL || `/assets/accounts/${account.address}/logo.png`,
            address: account.address || '0x0000000000000000000000000000000000000000',
          }));
          setWallets(sanitized);
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
    () =>
      dataFeedList.map((token) => ({
        ...token,
        logoURL: getLogoURL(chainId, token.address as Address, dataFeedType),
      })),
    [dataFeedList, chainId, dataFeedType]
  );

  const wrapperClass =
    'bg-[#243056] w-full overflow-y-auto flex-grow p-2.5 text-[#5981F3] rounded-[20px] box-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

  if (!isClient) {
    return (
      <div className={wrapperClass}>
        <p>Loading data...</p>
      </div>
    );
  }

  if (dataFeedType === FEED_TYPE.RECIPIENT_ACCOUNTS || dataFeedType === FEED_TYPE.AGENT_ACCOUNTS) {
    if (loadingWallets) {
      return (
        <div className={wrapperClass}>
          <p>Loading accounts...</p>
        </div>
      );
    }
    if (wallets.length === 0) {
      return (
        <div className={wrapperClass}>
          <p>No accounts available.</p>
        </div>
      );
    }

    return (
      <div className={wrapperClass}>
        {wallets.map((wallet) => (
          <div
            key={wallet.address}
            className="flex flex-row justify-between mb-1 pt-2 px-5 hover:bg-spCoin_Blue-900 cursor-pointer"
            onClick={() => {
              debugLog.log(`[DataList] Clicked wallet: ${wallet.address}`);
              if (!wallet.address || !isAddress(wallet.address)) {
                debugLog.warn(`🚫 Invalid wallet address selected: ${wallet.address}`);
                onSelect({
                  ...wallet,
                  address: '0x0000000000000000000000000000000000000000',
                } as T);
                return;
              }
              onSelect(wallet as T);
            }}
          >
            <div className="flex items-center gap-3">
              <img
                className="h-8 w-8 object-contain rounded-full"
                src={wallet.logoURL || defaultMissingImage}
                alt={`${wallet.name} logo`}
              />
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
                alert(`${wallet.name} Record: ${stringifyBigInt(wallet.logoURL || '')}`);
              }}
            >
              <Image src={info_png} alt="Info Image" width={20} height={20} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (logoTokenList.length === 0) {
    return (
      <div className={wrapperClass}>
        <p>No tokens available.</p>
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      {logoTokenList.map((token) => {
        const handleSelect = () => {
          const selectedAddress = token.address?.trim();

          debugLog.log(`[DataList] Clicked token: ${selectedAddress}`);

          if (!selectedAddress || !isAddress(selectedAddress)) {
            onSelect({
              address: '0x0000000000000000000000000000000000000000',
              symbol: 'N/A',
              name: 'Invalid Token',
              logoURL: defaultMissingImage,
              decimals: 18,
              balance: 0n,
              amount: 0n,
              totalSupply: 0n,
            } as T);
            return;
          }

          const tokenContract: TokenContract = {
            address: selectedAddress as `0x${string}`,
            symbol: token.symbol,
            name: token.name,
            logoURL: token.logoURL || defaultMissingImage,
            decimals: token.decimals || 18,
            balance: 0n,
            amount: 0n,
            totalSupply: BigInt(0),
          };
          onSelect(tokenContract as T);
        };

        return (
          <div
            key={token.address}
            className="flex flex-row justify-between mb-1 pt-2 px-5 hover:bg-spCoin_Blue-900 cursor-pointer"
            onClick={handleSelect}
          >
            <div className="flex flex-row items-center gap-3">
              <img
                className="h-8 w-8 object-contain rounded-full"
                src={token.logoURL || defaultMissingImage}
                alt={`${token.name} logo`}
              />
              <div>
                <div className="font-semibold">{token.name}</div>
                <div className="text-sm text-gray-400">{token.symbol}</div>
              </div>
            </div>
            <div
              className="py-3 cursor-pointer rounded w-8 h-8 text-lg font-bold text-white"
              onClick={(e) => {
                e.stopPropagation();
                alert(`${token.name} Address: ${stringifyBigInt(token)}`);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                alert(`${token.name} Record: ${token.logoURL}`);
              }}
            >
              <Image src={info_png} alt="Info Image" width={20} height={20} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
