//File: components\containers\TokenSelectDropDown.tsx

'use client';

import { useState, useMemo } from 'react';
import styles from '@/styles/Exchange.module.css';
import { TokenSelectDialog } from '../Dialogs/Dialogs';
import { ChevronDown } from 'lucide-react';

import {
  CONTAINER_TYPE,
  TokenContract,
  InputState,
} from '@/lib/structure/types';
import { defaultMissingImage } from '@/lib/network/utils';
import { useContainerType } from '@/lib/context/contextHooks';
import { useInputValidationState } from '@/lib/hooks/useInputValidationState';
import { useChainId } from 'wagmi';
import { isAddress } from 'viem';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME: boolean = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_TOKEN_SELECT_DROP_DOWN === 'true';
const debugLog = createDebugLogger('TokenSelectDropDown', DEBUG_ENABLED, LOG_TIME);

const seenBrokenAvatars = new Set<string>();

export function useTokenLogoURL(tokenContract?: TokenContract): string {
  return useAddressLogoURL(
    tokenContract?.address,
    tokenContract?.chainId,
    true
  );
}

export function useAddressLogoURL(
  address?: string,
  chainIdOverride?: number,
  testInputState: boolean = false
): string {
  const fallbackChainId = useChainId();
  const { inputState } = useInputValidationState(address);

  const logoUrl = useMemo(() => {
    const chainId = chainIdOverride ?? fallbackChainId;

    if (!address || !isAddress(address)) return defaultMissingImage;
    if (seenBrokenAvatars.has(address)) return defaultMissingImage;
    if (testInputState && inputState === InputState.CONTRACT_NOT_FOUND_LOCALLY)
      return defaultMissingImage;

    const logoURL = `/assets/blockchains/${chainId}/contracts/${address}/avatar.png`;
    debugLog.log(`getAddressLogoURL.logoURL=${logoURL}`);
    return logoURL;
  }, [address, chainIdOverride, fallbackChainId, inputState, testInputState]);

  return logoUrl;
}

interface Props {
  containerType: CONTAINER_TYPE;
  tokenContract: TokenContract | undefined;
  setDecimalAdjustedContract: (tokenContract: TokenContract) => void;
}

function TokenSelectDropDown({
  containerType,
  tokenContract,
  setDecimalAdjustedContract,
}: Props) {
  const [showDialog, setShowDialog] = useState(false);
  const [, setContainerType] = useContainerType();
  const { inputState } = useInputValidationState(tokenContract?.address);

  const avatarSrc = useTokenLogoURL(tokenContract);

  const handleMissingLogoURL = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const tokenAddr = tokenContract?.address;
    if (!tokenAddr) return;

    seenBrokenAvatars.add(tokenAddr);
    event.currentTarget.src = defaultMissingImage;

    console.warn(
      `[TokenSelectDropDown] Missing avatar for ${tokenContract?.symbol} (${tokenAddr})`
    );
  };

  return (
    <>
      <TokenSelectDialog
        showDialog={showDialog}
        setShowDialog={setShowDialog}
        onClose={(contract: TokenContract | undefined, inputState: InputState) => {
          if (inputState === InputState.CLOSE_INPUT && contract) {
            setDecimalAdjustedContract(contract);
          }
        }}
      />
      <div className={styles.assetSelect}>
        {tokenContract ? (
          <>
            <img
              className="h-9 w-9 mr-2 rounded-md cursor-pointer"
              alt={`${tokenContract.name} Token logoURL`}
              src={avatarSrc}
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
          onClick={() => {
            setContainerType(containerType);
            setShowDialog(true);
          }}
        />
      </div>
    </>
  );
}

export default TokenSelectDropDown;