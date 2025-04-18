"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import styles from "@/styles/Modal.module.css";
import Image from "next/image";
import info_png from "@/public/assets/miscellaneous/info1.png";
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils'
import { useChainId } from "wagmi";
import { useBuyTokenContract, useContainerType, useExchangeContext, useSellTokenContract } from '@/lib/context/contextHooks'  // ✅ Use Hook
import {
  BASE,
  CONTAINER_TYPE,
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
  getAvatarAddress
} from "@/lib/network/utils";
import { loadAccounts } from "@/lib/spCoin/loadAccounts";

// Token Lists
import baseTokenList from "@/resources/data/networks/base/tokenList.json";
import hardhatTokenList from "@/resources/data/networks/hardhat/tokenList.json";
import polygonTokenList from "@/resources/data/networks/polygon/tokenList.json";
import sepoliaTokenList from "@/resources/data/networks/sepolia/tokenList.json";
import ethereumTokenList from "@/resources/data/networks/ethereum/tokenList.json";
import agentJsonList from "@/resources/data/agents/agentJsonList.json";
import recipientJsonList from "@/resources/data/recipients/recipientJsonList.json";
import { Address } from "viem";
import { InputState } from "../TokenSelectDialog";

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

  const previous = useRef<bigint | undefined>(undefined);

  useEffect(() => {
    setIsClient(true); // Prevent SSR mismatch

    const fetchWallets = async () => {
      try {
        const [agents, recipients] = await Promise.all([
          loadAccounts(agentJsonList),
          loadAccounts(recipientJsonList),
        ]);
        setAgentWalletList(agents || []);
        setRecipientWalletList(recipients || []);
        // console.log("🔹 Loaded Recipient Wallets:", recipients);  // Debug Step 1 ✅
      } catch (error) {
        console.error("❌ Error loading wallets:", error);
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

// 🔹 Optimized `DataList` component
type Props = {
  inputState: InputState;
  setInputState: (state: InputState) => void;
  dataFeedType: FEED_TYPE;
};

const DataList = ({ inputState, setInputState, dataFeedType }: Props) => {
  const [isClient,  setIsClient] = useState(false);
  const chainId = useChainId(); // ✅ Ensure it's not used on SSR
  const walletLists = useWalletLists();
  const { exchangeContext } = useExchangeContext();
  const [containerType] = useContainerType();
  const [sellTokenContract, setSellTokenContract] = useSellTokenContract();
  const [buyTokenContract, setBuyTokenContract] = useBuyTokenContract();

  /** ✅ Prevent SSR Mismatch */
  useEffect(() => {
    setIsClient(true);
  }, []);

  /** ✅ Memoized Data Feed (Ensures it’s always an array) */
  const dataFeedList = useMemo(() => {
    const list = isClient ? getDataFeedList(dataFeedType, chainId, walletLists) : [];
    // console.log(`🔍 Computed DataFeedList for ${dataFeedType}:`, list);  // Debug Step 1 ✅
    // console.log(`📊 DataFeedList Length: ${list.length}`);
    return Array.isArray(list) ? list : [];
  }, [dataFeedType, chainId, walletLists, isClient]);

  /** ✅ Memoized Avatars */
  const avatars = useMemo(() => {
    return dataFeedList.map((listElement) => ({
      ...listElement,
      avatar: getAvatarAddress(exchangeContext, listElement.address as Address, dataFeedType),
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
            <div className="cursor-pointer flex flex-row justify-between"
                 onClick={() => {
                   console.log(`🖱 Clicked Element Data: dataFeedList[${i}] = ${stringifyBigInt(dataFeedList[i])}`);  // Debug Step 1 ✅
                   containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
                   ? setSellTokenContract(dataFeedList[i] as TokenContract)
                   : setBuyTokenContract(dataFeedList[i] as TokenContract);
                  setInputState(InputState.CLOSE_INPUT)
                  //  updateTokenCallback(dataFeedList[i]);
                 }}>
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
