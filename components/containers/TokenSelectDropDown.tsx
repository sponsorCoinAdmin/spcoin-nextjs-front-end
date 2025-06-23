'use client';

import { useMemo, useState } from 'react';
import styles from '@/styles/Exchange.module.css';
import { TokenSelectDialog } from '@/components/Dialogs/AssetSelectDialogs';
import { ChevronDown } from 'lucide-react';

import {
  CONTAINER_TYPE,
  InputState,
  TokenContract,
} from '@/lib/structure';

import { useTradeData } from '@/lib/context/hooks';
import { isAddress } from 'viem';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { defaultMissingImage } from '@/lib/network/utils';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useLocalChainId } from '@/lib/context/hooks/nestedHooks/useLocalChainId';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_TOKEN_SELECT_DROP_DOWN === 'true';
const debugLog = createDebugLogger('TokenSelectDropDown', DEBUG_ENABLED, LOG_TIME);

const seenBrokenLogos = new Set<string>();

function useTokenLogoURL(tokenContract?: TokenContract): string {
  const chainId = useLocalChainId();
  const address = tokenContract?.address;

  return useMemo(() => {
    if (!address || !isAddress(address)) return defaultMissingImage;
    if (!chainId) return defaultMissingImage;
    if (seenBrokenLogos.has(address)) return defaultMissingImage;

    const logoURL = `/assets/blockchains/${chainId}/contracts/${address}/logo.png`;
    debugLog.log(`✅ logoURL = ${logoURL}`);
    return logoURL;
  }, [address, chainId]);
}

interface Props {
  containerType: CONTAINER_TYPE;
}

function TokenSelectDropDown({ containerType }: Props) {
  const [showContainer, setShowDialog] = useState(false);

  const tradeData = useTradeData();
  const tokenContract =
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
      ? tradeData.sellTokenContract
      : tradeData.buyTokenContract;

  const logoSrc = useTokenLogoURL(tokenContract);

  const handleMissingLogoURL = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const tokenAddr = tokenContract?.address;
    if (!tokenAddr) return;

    seenBrokenLogos.add(tokenAddr);
    event.currentTarget.src = defaultMissingImage;

    console.warn(`[TokenSelectDropDown] Missing logo for ${tokenContract?.symbol} (${tokenAddr})`);
  };

  return (
    <>
      <TokenSelectDialog
        showContainer={showContainer}
        setShowDialog={setShowDialog}
        containerType={containerType}
        onSelect={(contract: TokenContract, inputState: InputState) => {
          if (inputState === InputState.CLOSE_INPUT && contract) {
            debugLog.log('🎯 onSelect → updating tokenContract in context', contract);
            if (containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER) {
              tradeData.sellTokenContract = structuredClone(contract);
            } else {
              tradeData.buyTokenContract = structuredClone(contract);
            }
          }
        }}
      />
      <div className={styles.assetSelect}>
        {tokenContract ? (
          <>
            <img
              className="h-9 w-9 mr-2 rounded-md cursor-pointer"
              alt={`${tokenContract.name} logo`}
              src={logoSrc}
              onClick={() => alert(stringifyBigInt(tokenContract))}
              onError={handleMissingLogoURL}
            />
            {tokenContract.symbol}
          </>
        ) : (
          <>Select Token:</>
        )}
        <ChevronDown
          size={18}
          className="ml-2 cursor-pointer"
          onClick={() => setShowDialog(true)}
        />
      </div>
    </>
  );
}

export default TokenSelectDropDown;
