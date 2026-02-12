// File: @/components/views/sharedPreviews/RenderAssetPreview.tsx

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import type { Address } from 'viem';

import BasePreviewWrapper from './BasePreviewWrapper';
import BaseListRow from '@/components/views/ListItems/BaseListRow';

import { useAssetSelectContext } from '@/lib/context';
import { isRenderFSMState } from '@/lib/hooks/inputValidations/FSM_Core/fSMInputStates';
import { FEED_TYPE, SP_COIN_DISPLAY, type TokenContract } from '@/lib/structure';
import { InputState } from '@/lib/structure/assetSelection';
import { useAppChainId, usePanelTree, usePreviewTokenContract, usePreviewTokenSource } from '@/lib/context/hooks';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';

import {
  defaultMissingImage,
  getLogoURL,
  getWalletLogoURL,
} from '@/lib/context/helpers/assetHelpers';

import { createDebugLogger } from '@/lib/utils/debugLogger';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_ASSET_SELECT === 'true';
const debugLog = createDebugLogger(
  'RenderAssetPreview',
  DEBUG_ENABLED,
  LOG_TIME,
);

export default function RenderAssetPreview() {
  const [chainId] = useAppChainId();
  const { openPanel } = usePanelTree();
  const [, setPreviewTokenContract] = usePreviewTokenContract();
  const [, setPreviewTokenSource] = usePreviewTokenSource();
  const buyMode = usePanelVisible(SP_COIN_DISPLAY.BUY_CONTRACT);
  const sellMode = usePanelVisible(SP_COIN_DISPLAY.SELL_CONTRACT);
  const ctx: any = useAssetSelectContext();

  const {
    inputState,
    validatedAsset,
    setValidatedAsset,
    setInputState,
    feedType,
    manualEntry,
    setManualEntry,
  } = ctx;

  // Keep a live ref of manualEntry so logs always show the freshest value
  const manualEntryRef = useRef<boolean>(!!manualEntry);
  useEffect(() => {
    manualEntryRef.current = !!manualEntry;
  }, [manualEntry]);

  const [avatarSrc, setAvatarSrc] = useState<string>(defaultMissingImage);

  useEffect(() => {
    let cancelled = false;

    const resolveLogo = async () => {
      const visible = isRenderFSMState(inputState);
      if (!visible || !validatedAsset) return;

      const address = validatedAsset.address as string | undefined;

      // Default while resolving/guarding
      setAvatarSrc((prev) => prev || defaultMissingImage);

      if (feedType === FEED_TYPE.TOKEN_LIST) {
        // Token logos → chain/contracts/<ADDR>/logo.png via getLogoURL
        if (!address || !chainId) {
          if (!cancelled) setAvatarSrc(defaultMissingImage);
          return;
        }
        try {
          const url = await getLogoURL(
            chainId,
            address as Address,
            FEED_TYPE.TOKEN_LIST,
          );
          if (!cancelled) {
            setAvatarSrc(url || defaultMissingImage);
            debugLog.log?.('🖼️ Resolved token logo', {
              chainId,
              address,
              url,
            });
          }
        } catch (e) {
          if (!cancelled) {
            setAvatarSrc(defaultMissingImage);
            debugLog.warn?.('⚠️ getLogoURL failed; using fallback', {
              chainId,
              address,
              error: e,
            });
          }
        }
      } else {
        // Recipient / agent / other wallet-like: use wallet helper
        const url =
          validatedAsset.logoURL ||
          getWalletLogoURL(address) ||
          defaultMissingImage;

        if (!cancelled) {
          setAvatarSrc(url);
          debugLog.log?.('🖼️ Resolved wallet/logo asset', {
            address,
            url,
            feedType,
          });
        }
      }
    };

    resolveLogo();
    return () => {
      cancelled = true;
    };
  }, [inputState, validatedAsset, feedType, chainId]);

  const visible = isRenderFSMState(inputState);
  if (!visible || !validatedAsset) return null;

  const name = validatedAsset.name ?? 'N/A';
  const symbol = validatedAsset.symbol ?? 'N/A';
  const address = validatedAsset.address as string | undefined;

  const onAvatarClick = () => {
    if (!address) return;

    debugLog.log?.('[onAvatarClick]', {
      manualEntry: manualEntryRef.current,
      addressPreview: address.slice(0, 10),
      inputState: InputState[inputState],
    });

    try {
      // 1) Flip manualEntry → false synchronously so FSM treats this as programmatic select
      debugLog.log?.(
        '[onAvatarClick] forcing manualEntry=false before commit',
      );
      flushSync(() => setManualEntry?.(false));

      // 2) Ensure chainId/address present on the committed object
      const assetToCommit: any = { ...validatedAsset };
      if (!assetToCommit.address) assetToCommit.address = address as Address;
      if (!assetToCommit.chainId) assetToCommit.chainId = chainId;

      // 3) Write the validated asset
      if (typeof setValidatedAsset === 'function') {
        setValidatedAsset(assetToCommit);
        debugLog.log?.('[onAvatarClick] setValidatedAsset dispatched', {
          address: assetToCommit.address,
          chainId: assetToCommit.chainId,
          symbol: assetToCommit.symbol,
          name: assetToCommit.name,
        });
      } else {
        debugLog.warn?.(
          '⚠️ setValidatedAsset not available in context (RenderAssetPreview)',
        );
      }

      // 4) Advance FSM → RETURN_VALIDATED_ASSET; bridge will commit + close panel
      setInputState(
        InputState.RETURN_VALIDATED_ASSET,
        'RenderAssetPreview → RETURN_VALIDATED_ASSET (avatar click)',
      );
    } catch (err) {
      debugLog.error?.('❌ Failed to dispatch validated asset', err);
    }
  };

  const onInfoClick = () => {
    if (feedType === FEED_TYPE.TOKEN_LIST) {
      if (!address) return;

      const token: TokenContract = {
        address: address as any,
        name,
        symbol,
        logoURL: avatarSrc,
        balance: 0n,
      };

      setPreviewTokenSource(buyMode ? 'BUY' : sellMode ? 'SELL' : null);
      setPreviewTokenContract(token);
      openPanel(
        SP_COIN_DISPLAY.TOKEN_PANEL,
        'RenderAssetPreview:onInfoClick(openTokenPanel)',
      );
      openPanel(
        SP_COIN_DISPLAY.PREVIEW_CONTRACT,
        'RenderAssetPreview:onInfoClick(openPreviewToken)',
        SP_COIN_DISPLAY.TOKEN_PANEL,
      );

      debugLog.log?.('[onInfoClick] opened TOKEN_PANEL preview', {
        address,
        name,
        symbol,
      });
    } else {
      debugLog.log?.('[onInfoClick] wallet object', {
        name,
        wallet: validatedAsset,
      });
    }
  };

  const onInfoContextMenu = () => {
    if (feedType === FEED_TYPE.TOKEN_LIST) {
      debugLog.log?.('[onInfoContextMenu] token logo URL', {
        name,
        avatarSrc,
      });
    } else {
      debugLog.log?.('[onInfoContextMenu] wallet logo record', {
        name,
        logoURL: stringifyBigInt(validatedAsset.logoURL || ''),
      });
    }
  };

  return (
    <div id="RenderAssetPreview" className="w-full">
      <BasePreviewWrapper show>
        <BaseListRow
          className="w-full"
          avatarSrc={avatarSrc}
          title={name}
          subtitle={symbol}
          onAvatarClick={onAvatarClick}
          onInfoClick={onInfoClick}
          onInfoContextMenu={onInfoContextMenu}
        />
      </BasePreviewWrapper>
    </div>
  );
}
