// File: components/Dialogs/Resources/DataList.tsx

'use client';

import React, { useEffect, useState, useMemo } from 'react';
import styles from '@/styles/Modal.module.css';
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
          const sanitized = accounts.map((account, index) => {
            const sanitizedAccount: WalletAccount = {
              ...account,
              name: account.name || 'N/A',
              symbol: account.symbol || 'N/A',
              logoURL: account.logoURL || `/assets/accounts/${account.address}/logo.png`,
              address: account.address || '0x0000000000000000000000000000000000000000',
            };
            debugLog.log(`📘 [${index}] ${sanitizedAccount.address} — name: ${sanitizedAccount.name}`);
            return sanitizedAccount;
          });
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
    () => dataFeedList.map((token) => ({
      ...token,
      logoURL: getLogoURL(chainId, token.address as Address, dataFeedType),
    })),
    [dataFeedList, chainId, dataFeedType]
  );

  if (!isClient) return <p>Loading data...</p>;

  if (dataFeedType === FEED_TYPE.RECIPIENT_ACCOUNTS || dataFeedType === FEED_TYPE.AGENT_ACCOUNTS) {
    if (loadingWallets) return <p>Loading accounts...</p>;
    if (wallets.length === 0) return <p>No accounts available.</p>;

    return (
      <>
        {wallets.map((wallet, index) => (
          <div
            key={wallet.address}
            className="flex flex-row justify-between mb-1 pt-2 px-5 hover:bg-spCoin_Blue-900 cursor-pointer"
            onClick={() => {
              if (!wallet.address || !isAddress(wallet.address)) {
                debugLog.warn(`🚫 Invalid wallet address selected: ${wallet.address}`);
                onSelect({
                  ...wallet,
                  address: '0x0000000000000000000000000000000000000000',
                } as T);
                return;
              }

              debugLog.log(`[DataList] Selected: ${wallet.address}`);
              onSelect(wallet as T);
            }}
          >
            <div className="flex items-center gap-3">
              <img
                className={styles.elementLogo}
                src={wallet.logoURL || defaultMissingImage}
                alt={`${wallet.name} logo`}
                width={32}
                height={32}
              />
              <div>
                <div className={styles.elementName}>{wallet.name}</div>
                <div className={styles.elementSymbol}>{wallet.symbol}</div>
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
              <Image className={styles.infoLogo} src={info_png} alt="Info Image" width={20} height={20} />
            </div>
          </div>
        ))}
      </>
    );
  }

  if (logoTokenList.length === 0) {
    return <p>No tokens available.</p>;
  }

  return (
    <>
      {logoTokenList.map((token) => {
        const handleSelect = () => {
          const selectedAddress = token.address?.trim();

          // ✅ Explicitly insert empty string into the address input
          if (!selectedAddress) {
            debugLog.warn(`⚠️ Empty address selected for token: ${token.name}`);
            onSelect({
              ...token,
              address: '' // Pass blank address to flow through onChange('')
            } as T);
            return;
          }

          if (!isAddress(selectedAddress)) {
            debugLog.warn(`🚫 Invalid token address selected: ${selectedAddress}`);
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

          debugLog.log(`[DataList] Selected: ${selectedAddress}`);
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
            className="flex flex-row justify-between mb-1 pt-2 px-5 hover:bg-spCoin_Blue-900"
            onClick={handleSelect}
          >
            <div className="cursor-pointer flex flex-row justify-between">
              <img
                className={styles.elementLogo}
                src={token.logoURL || defaultMissingImage}
                alt={`${token.name} logo`}
                width={32}
                height={32}
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
                alert(`${token.name} Address: ${console.log(stringifyBigInt(token))}`);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                alert(`${token.name} Record: ${token.logoURL}`);
              }}
            >
              <Image className={styles.infoLogo} src={info_png} alt="Info Image" width={20} height={20} />
            </div>
          </div>
        );
      })}
    </>
  );
}
