'use client';

import styles from '@/styles/Exchange.module.css';
import {
  CONTAINER_TYPE,
  TokenContract,
  WalletAccount,
  InputState,
  getInputStateString,
} from '@/lib/structure';
import { usePriceAPI } from '@/lib/0X/hooks/usePriceAPI';

import TradeContainerHeader from '@/components/Headers/TradeContainerHeader';
import BuySellSwapArrowButton from '@/components/Buttons/BuySellSwapArrowButton';
import PriceButton from '@/components/Buttons/PriceButton';
import AffiliateFee from '@/components/containers/AffiliateFee';
import FeeDisclosure from '@/components/containers/FeeDisclosure';
import { TokenSelectContainer } from '../containers/AssetSelectPanel';

import {
  SharedPanelProvider,
} from '@/lib/context/ScrollSelectPanel/SharedPanelContext';

import {
  useSellTokenContract,
  useBuyTokenContract,
} from '@/lib/context/hooks';

import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_MAIN_SWAP_VIEW === 'true';
const debugLog = createDebugLogger('TokenSelectContextView', DEBUG_ENABLED, LOG_TIME);

export default function TokenSelectContextView() {
  const { isLoading: isLoadingPrice, data: priceData } = usePriceAPI();

  const [, setSellTokenContract] = useSellTokenContract();
  const [, setBuyTokenContract] = useBuyTokenContract();

  const handleSellSelect = (item: TokenContract | WalletAccount | undefined, state: InputState) => {
    if (!item) {
      debugLog.warn('🟠 SELL onSelect called with undefined item');
      return;
    }
    const label = getInputStateString(state);
    debugLog.log(`🟠 SELL onSelect: ${label}`, item);
    if (state === InputState.CLOSE_SELECT_INPUT) {
      setSellTokenContract(structuredClone(item as TokenContract));
    }
  };

  const handleBuySelect = (item: TokenContract | WalletAccount | undefined, state: InputState) => {
    if (!item) {
      debugLog.warn('🔵 BUY onSelect called with undefined item');
      return;
    }
    const label = getInputStateString(state);
    debugLog.log(`🔵 BUY onSelect: ${label}`, item);
    if (state === InputState.CLOSE_SELECT_INPUT) {
      setBuyTokenContract(structuredClone(item as TokenContract));
    }
  };

  return (
    <div id="MainPage_ID">
      <div id="MainSwapContainer_ID" className={styles.mainSwapContainer}>
        <TradeContainerHeader />

        <SharedPanelProvider
          containerType={CONTAINER_TYPE.SELL_SELECT_CONTAINER}
          onSelect={handleSellSelect}
        >
          <TokenSelectContainer containerType={CONTAINER_TYPE.SELL_SELECT_CONTAINER} />
        </SharedPanelProvider>

        <SharedPanelProvider
          containerType={CONTAINER_TYPE.BUY_SELECT_CONTAINER}
          onSelect={handleBuySelect}
        >
          <TokenSelectContainer containerType={CONTAINER_TYPE.BUY_SELECT_CONTAINER} />
        </SharedPanelProvider>

        <BuySellSwapArrowButton />
        <PriceButton isLoadingPrice={isLoadingPrice} />
        <AffiliateFee priceResponse={priceData} />
      </div>
      <FeeDisclosure />
    </div>
  );
}
