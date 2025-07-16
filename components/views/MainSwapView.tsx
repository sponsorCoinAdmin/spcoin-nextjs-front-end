// File: components/views/MainSwapView.tsx

'use client';

import styles from '@/styles/Exchange.module.css';
import { CONTAINER_TYPE } from '@/lib/structure';

import { usePriceAPI } from '@/lib/0X/hooks/usePriceAPI';

import TradeContainerHeader from '@/components/Headers/TradeContainerHeader';
import BuySellSwapArrowButton from '@/components/Buttons/BuySellSwapArrowButton';
import PriceButton from '@/components/Buttons/PriceButton';
import AffiliateFee from '@/components/containers/AffiliateFee';
import FeeDisclosure from '@/components/containers/FeeDisclosure';
import { TokenSelectPanel } from '../containers/AssetSelectPanels';

import {
  SellTokenPanelProvider,
  BuyTokenPanelProvider,
} from '@/lib/context/TokenPanelProviders';

import { SharedPanelProvider } from '@/lib/context/ScrollSelectPanels/SharedPanelProvider';
import { useExchangeContext } from '@/lib/context/hooks';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { getActiveDisplayString } from '@/lib/context/helpers/activeDisplayHelpers';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_MAIN_SWAP_VIEW === 'true';
const debugLog = createDebugLogger('MainSwapView', DEBUG_ENABLED, LOG_TIME);

export default function MainSwapView() {
  const { exchangeContext } = useExchangeContext();
  const { activeDisplay } = exchangeContext.settings;

  debugLog.log(`🔍 MainSwapView render triggered`);
  debugLog.log(`🧩 Current activeDisplay = ${getActiveDisplayString(activeDisplay)}`);

  const { isLoading: isLoadingPrice, data: priceData } = usePriceAPI();

  return (
    <div id="MainPage_ID">
      <div id="MainSwapContainer_ID" className={styles.mainSwapContainer}>
        <TradeContainerHeader />

        <SharedPanelProvider>
          <SellTokenPanelProvider>
            <TokenSelectPanel containerType={CONTAINER_TYPE.SELL_SELECT_CONTAINER} />
          </SellTokenPanelProvider>

          <BuyTokenPanelProvider>
            <TokenSelectPanel containerType={CONTAINER_TYPE.BUY_SELECT_CONTAINER} />
          </BuyTokenPanelProvider>
        </SharedPanelProvider>

        <BuySellSwapArrowButton />
        <PriceButton isLoadingPrice={isLoadingPrice} />
        <AffiliateFee priceResponse={priceData} />
      </div>
      <FeeDisclosure />
    </div>
  );
}
