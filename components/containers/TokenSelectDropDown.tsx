'use client';

import { useMemo, useEffect, useState } from 'react';
import styles from '@/styles/Exchange.module.css';
import { TokenDialogWrapper } from '@/components/Dialogs/AssetSelectDialog';
import { ChevronDown } from 'lucide-react';

import {
  CONTAINER_TYPE,
  InputState,
  TokenContract,
} from '@/lib/structure';

import {
  useBuyTokenContract,
  useSellTokenContract,
} from '@/lib/context/hooks';

import { useInputValidationState } from '@/lib/hooks/useInputValidationState';
import { useChainId } from 'wagmi';
import { isAddress } from 'viem';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { defaultMissingImage } from '@/lib/network/utils';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_TOKEN_SELECT_DROP_DOWN === 'true';
const debugLog = createDebugLogger('TokenSelectDropDown', DEBUG_ENABLED, LOG_TIME);

const seenBrokenLogos = new Set<string>();

function useTokenLogoURL(tokenContract?: TokenContract): string {
  const chainId = useChainId();
  const address = tokenContract?.address;
  const { inputState } = useInputValidationState(address);

  return useMemo(() => {
    if (!address || !isAddress(address)) return defaultMissingImage;
    if (!chainId) return defaultMissingImage;
    if (seenBrokenLogos.has(address)) return defaultMissingImage;
    if (inputState === InputState.CONTRACT_NOT_FOUND_LOCALLY) return defaultMissingImage;

    const logoURL = `/assets/blockchains/${chainId}/contracts/${address}/logo.png`;
    debugLog.log(`✅ logoURL = ${logoURL}`);
    return logoURL;
  }, [address, chainId, inputState]);
}

interface Props {
  containerType: CONTAINER_TYPE;
}

function TokenSelectDropDown({ containerType }: Props) {
  const [showDialog, setShowDialog] = useState(false);

  const sellHook = useSellTokenContract();
  const buyHook = useBuyTokenContract();
  const [tokenContract, setTokenContract] =
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER ? sellHook : buyHook;
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
      <TokenDialogWrapper
        showDialog={showDialog}
        setShowDialog={setShowDialog}
        containerType={containerType}
        onSelect={(contract: TokenContract, inputState: InputState) => {
          if (inputState === InputState.CLOSE_INPUT && contract) {
            debugLog.log('🎯 onSelect → updating tokenContract in context', contract);
            setTokenContract(structuredClone(contract));
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
