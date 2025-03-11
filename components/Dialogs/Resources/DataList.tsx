"use client";

import React, { useEffect, useState, useMemo } from "react";
import styles from "@/styles/Modal.module.css";
import Image from "next/image";
import info_png from "@/public/assets/miscellaneous/info1.png";
import { useChainId } from "wagmi";
import { useExchangeContext } from "@/lib/context/ExchangeContext";  // ✅ Use Hook

import {
  BASE,
  ETHEREUM,
  FEED_TYPE,
  HARDHAT,
  POLYGON,
  SEPOLIA,
  TokenContract,
  WalletAccount
} from "@/lib/structure/types";
import {
    BURN_ADDRESS,
  defaultMissingImage,
  getAddressAvatar,
  useGetAddressAvatar,
} from "@/lib/network/utils";
import { loadWallets } from "@/lib/spCoin/loadWallets";

// Token Lists
import baseTokenList from "@/resources/data/networks/base/tokenList.json";
import hardhatTokenList from "@/resources/data/networks/hardhat/tokenList.json";
import polygonTokenList from "@/resources/data/networks/polygon/tokenList.json";
import sepoliaTokenList from "@/resources/data/networks/sepolia/tokenList.json";
import ethereumTokenList from "@/resources/data/networks/ethereum/tokenList.json";
import agentJsonList from "@/resources/data/agents/agentJsonList.json";
import recipientJsonList from "@/resources/data/recipients/recipientJsonList.json";
import { Address } from "viem";

const publicWalletPath = "/path/to/public/wallets"; // Update as needed

// 🔹 Store active account address globally
let ACTIVE_ACCOUNT_ADDRESS: Address;

const setActiveAccount = (address: Address) => {
  ACTIVE_ACCOUNT_ADDRESS = address;
};

// 🔹 Hook to fetch wallets only once
const useWalletLists = () => {
  const [recipientWalletList, setRecipientWalletList] = useState<WalletAccount[]>([]);
  const [agentWalletList, setAgentWalletList] = useState<WalletAccount[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // Prevent SSR mismatch

    const fetchWallets = async () => {
      try {
        const [agents, recipients] = await Promise.all([
          loadWallets(publicWalletPath, agentJsonList),
          loadWallets(publicWalletPath, recipientJsonList),
        ]);
        setAgentWalletList(agents || []);
        setRecipientWalletList(recipients || []);
      } catch (error) {
        console.error("Error loading wallets:", error);
      }
    };
    fetchWallets();
  }, []);

  if (!isClient) {
    return { recipientWalletList: [], agentWalletList: [] }; // Ensures consistent SSR/CSR output
  }

  return { recipientWalletList, agentWalletList };
};



// 🔹 Function to get data feed list
const getDataFeedList = (feedType: FEED_TYPE, chainId: number, walletLists: { recipientWalletList: WalletAccount[], agentWalletList: WalletAccount[] }) => {
  switch (feedType) {
    case FEED_TYPE.AGENT_WALLETS:
      return walletLists.agentWalletList;
    case FEED_TYPE.RECIPIENT_WALLETS:
      return walletLists.recipientWalletList;
    case FEED_TYPE.TOKEN_LIST:
      switch (chainId) {
        case BASE:
          return baseTokenList;
        case ETHEREUM:
          return ethereumTokenList;
        case POLYGON:
          return polygonTokenList;
        case HARDHAT:
          return hardhatTokenList;
        case SEPOLIA:
          return sepoliaTokenList;
        default:
          return ethereumTokenList;
      }
    default:
      return ethereumTokenList;
  }
};

// 🔹 Get data map (improved)
const getDataFeedMap = (feedType: FEED_TYPE, chainId: number, walletLists: any) => {
  return new Map(getDataFeedList(feedType, chainId, walletLists).map((element: { address: any }) => [element.address, element]));
};

// 🔹 Display token details
const displayElementDetail = (tokenContract: any) => {
  const clone = { ...tokenContract } as TokenContract;
  clone.address = clone.address === BURN_ADDRESS ? ACTIVE_ACCOUNT_ADDRESS : clone.address;
  alert(`${tokenContract?.name} Token Address = ${clone.address}`);
};

// 🔹 Set missing avatar
const setMissingAvatar = (event: { currentTarget: { src: string } }) => {
  event.currentTarget.src = defaultMissingImage;
};

// 🔹 Optimized `DataList` component
const DataList = ({ dataFeedType, updateTokenCallback }: { dataFeedType: FEED_TYPE; updateTokenCallback: (listElement: any) => void }) => {
  const [isClient, setIsClient] = useState(false);
  const chainId = useChainId(); // ✅ Ensure it's not used on SSR
  const walletLists = useWalletLists();
  const { exchangeContext } = useExchangeContext();

  /** ✅ Prevent SSR Mismatch */
  useEffect(() => {
    setIsClient(true);
  }, []);

  /** ✅ Memoized Data Feed (Ensures it’s always an array) */
  const dataFeedList = useMemo(() => {
    return isClient ? getDataFeedList(dataFeedType, chainId, walletLists) || [] : [];
  }, [dataFeedType, chainId, walletLists, isClient]);

  /** ✅ Memoized Avatars */
  const avatars = useMemo(() => {
    return dataFeedList.map((listElement) => ({
      ...listElement,
      avatar: getAddressAvatar(exchangeContext, listElement.address as Address, dataFeedType),
    }));
  }, [dataFeedList, exchangeContext, dataFeedType]);

  /** ✅ Prevent SSR Hydration Errors */
  if (!isClient) {
    return <p>Loading data...</p>;
  }

  return (
    <>
      {avatars.length === 0 ? (
        <p>No data available.</p>
      ) : (
        avatars.map((listElement, i) => (
          <div className="flex flex-row justify-between mb-1 pt-2 px-5 hover:bg-spCoin_Blue-900" key={listElement.address}>
            <div className="cursor-pointer flex flex-row justify-between" onClick={() => updateTokenCallback(dataFeedList[i])}>
              <img className={styles.elementLogo} src={listElement.avatar || defaultMissingImage} alt={`${listElement.name} Token Avatar`} />
              <div>
                <div className={styles.elementName}>{listElement.name}</div>
                <div className={styles.elementSymbol}>{listElement.symbol}</div>
              </div>
            </div>
            <div className="py-3 cursor-pointer rounded border-none w-8 h-8 text-lg font-bold text-white" onClick={() => alert(`${listElement.name} Address: ${listElement.address}`)}>
              <Image className={styles.infoLogo} src={info_png} alt="Info Image" />
            </div>
          </div>
        ))
      )}
    </>
  );
};

export default DataList;
export { getDataFeedList, getDataFeedMap, setActiveAccount };
