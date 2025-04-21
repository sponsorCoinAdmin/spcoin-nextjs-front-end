'use client'; 

import React, { useEffect, useState, useMemo } from "react";
import styles from "@/styles/Modal.module.css";
import Image from "next/image";
import info_png from "@/public/assets/miscellaneous/info1.png";
import { useChainId } from "wagmi";
import {
  useBuyTokenContract,
  useContainerType,
  useExchangeContext,
  useSellTokenContract,
  useSlippageBps
} from '@/lib/context/contextHooks';
import {
  BASE,
  CONTAINER_TYPE,
  ETHEREUM,
  FEED_TYPE,
  HARDHAT,
  POLYGON,
  SEPOLIA,
  TokenContract,
  WalletAccount,
  TRADE_DIRECTION
} from "@/lib/structure/types";
import {
  BURN_ADDRESS,
  defaultMissingImage,
  getAvatarAddress
} from "@/lib/network/utils";
import { loadAccounts } from "@/lib/spCoin/loadAccounts";
import baseTokenList from "@/resources/data/networks/base/tokenList.json";
import hardhatTokenList from "@/resources/data/networks/hardhat/tokenList.json";
import polygonTokenList from "@/resources/data/networks/polygon/tokenList.json";
import sepoliaTokenList from "@/resources/data/networks/sepolia/tokenList.json";
import ethereumTokenList from "@/resources/data/networks/ethereum/tokenList.json";
import agentJsonList from "@/resources/data/agents/agentJsonList.json";
import recipientJsonList from "@/resources/data/recipients/recipientJsonList.json";
import { Address, isAddress } from "viem";
import { InputState } from "../TokenSelectDialog";
import { useResolvedTokenContractInfo, useValidatedTokenSelect } from '@/lib/hooks/UseAddressSelectHooks';

let ACTIVE_ACCOUNT_ADDRESS: Address;

const setActiveAccount = (address: Address) => {
  ACTIVE_ACCOUNT_ADDRESS = address;
};

const useWalletLists = () => {
  const [recipientAccountList, setRecipientAccountList] = useState<WalletAccount[]>([]);
  const [agentAccountList, setAgentAccountList] = useState<WalletAccount[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const fetchWallets = async () => {
      try {
        const [agents, recipients] = await Promise.all([
          loadAccounts(agentJsonList),
          loadAccounts(recipientJsonList),
        ]);
        setAgentAccountList(agents || []);
        setRecipientAccountList(recipients || []);
      } catch (error) {
        console.error("❌ Error loading wallets:", error);
      }
    };
    fetchWallets();
  }, []);

  if (!isClient) {
    return { recipientAccountList: [], agentAccountList: [] };
  }

  return { recipientAccountList, agentAccountList };
};

const getDataFeedList = (
  feedType: FEED_TYPE,
  chainId: number,
  walletLists: { recipientAccountList: WalletAccount[]; agentAccountList: WalletAccount[] }
) => {
  switch (feedType) {
    case FEED_TYPE.AGENT_WALLETS:
      return walletLists.agentAccountList;
    case FEED_TYPE.RECIPIENT_WALLETS:
      return walletLists.recipientAccountList;
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

const getDataFeedMap = (feedType: FEED_TYPE, chainId: number, walletLists: any) => {
  return new Map(
    getDataFeedList(feedType, chainId, walletLists).map((element: { address: any }) => [
      element.address,
      element,
    ])
  );
};

const displayElementDetail = (tokenContract: any) => {
  const clone = { ...tokenContract } as TokenContract;
  clone.address = clone.address === BURN_ADDRESS ? ACTIVE_ACCOUNT_ADDRESS : clone.address;
  alert(`${tokenContract?.name} Token Address = ${clone.address}`);
};

type Props = {
  inputState: InputState;
  setInputState: (state: InputState) => void;
  dataFeedType: FEED_TYPE;
};

const DataList = ({ inputState, setInputState, dataFeedType }: Props) => {
  const [isClient, setIsClient] = useState(false);
  const [validTokenAddress, setValidTokenAddress] = useState<Address | undefined>();
  const chainId = useChainId();
  const walletLists = useWalletLists();
  const { exchangeContext } = useExchangeContext();
  const [containerType] = useContainerType();
  const [sellTokenContract, setSellTokenContract] = useSellTokenContract();
  const [buyTokenContract, setBuyTokenContract] = useBuyTokenContract();
  const [slippageBpsRaw] = useSlippageBps();
  const slippageBps = slippageBpsRaw ?? 200;
  const tradeDirection = exchangeContext.tradeData.tradeDirection ?? TRADE_DIRECTION.SELL_EXACT_OUT;
  const [tokenContract, isTokenContractResolved] = useResolvedTokenContractInfo(validTokenAddress);
  const selectTokenAndClose = useValidatedTokenSelect(inputState, isTokenContractResolved, setInputState);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const dataFeedList = useMemo(() => {
    const list = isClient ? getDataFeedList(dataFeedType, chainId, walletLists) : [];
    return Array.isArray(list) ? list : [];
  }, [dataFeedType, chainId, walletLists, isClient]);

  const avatars = useMemo(() => {
    return dataFeedList.map((listElement) => ({
      ...listElement,
      avatar: getAvatarAddress(
        {
          ...exchangeContext,
          tradeData: {
            ...exchangeContext.tradeData,
            chainId,
            sellTokenContract,
            buyTokenContract,
            slippageBps,
            tradeDirection,
          },
        },
        listElement.address as Address,
        dataFeedType
      ),
    }));
  }, [dataFeedList, exchangeContext, chainId, sellTokenContract, buyTokenContract, slippageBps, tradeDirection, dataFeedType]);

  if (!isClient) {
    return <p>Loading data...</p>;
  }

  const validateTokenAddress = (token: TokenContract): boolean => {
    if (!token?.address || !isAddress(token.address)) {
      setInputState(InputState.INVALID_ADDRESS_INPUT);
      return false;
    }
    setValidTokenAddress(token.address);

    const oppositeAddress =
      containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
        ? exchangeContext.tradeData.buyTokenContract?.address
        : exchangeContext.tradeData.sellTokenContract?.address;

    if (token.address === oppositeAddress) {
      setInputState(InputState.DUPLICATE_INPUT);
      return false;
    }

    setInputState(InputState.VALID_INPUT);
    return true;
  };

  return (
    <>
      {avatars.length === 0 ? (
        <p>No data available.</p>
      ) : (
        avatars.map((listElement, i) => {
          const token = dataFeedList[i] as TokenContract;
          return (
            <div
              className="flex flex-row justify-between mb-1 pt-2 px-5 hover:bg-spCoin_Blue-900"
              key={listElement.address}
            >
              <div
                className="cursor-pointer flex flex-row justify-between"
                onClick={() => {
                  if (validateTokenAddress(token)) {
                    selectTokenAndClose(token);
                  }
                }}>
                <img
                  className={styles.elementLogo}
                  src={listElement.avatar || defaultMissingImage}
                  alt={`${listElement.name} Token Avatar`}
                />
                <div>
                  <div className={styles.elementName}>{listElement.name}</div>
                  <div className={styles.elementSymbol}>{listElement.symbol}</div>
                </div>
              </div>
              <div className="py-3 cursor-pointer rounded border-none w-8 h-8 text-lg font-bold text-white"
                   onClick={() => alert(`${listElement.name} Address: ${listElement.address}`)}>
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
export { getDataFeedList, getDataFeedMap, setActiveAccount };
