// File: components/shared/utils/sharedPreviews/RenderAssetPreview.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Address } from 'viem';
import { useChainId } from 'wagmi';
import BasePreviewWrapper from './BasePreviewWrapper';
import { useAssetSelectionContext } from '@/lib/context/ScrollSelectPanels/useAssetSelectionContext';
import { isRenderFSMState } from '@/lib/hooks/inputValidations/FSM_Core/fSMInputStates';
import { FEED_TYPE } from '@/lib/structure';
import { InputState } from '@/lib/structure/assetSelection';
import { getLogoURL, defaultMissingImage } from '@/lib/network/utils';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import BaseListRow from '@/components/views/ListItems/BaseListRow';

const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ASSET_SELECT === 'true';
const debugLog = createDebugLogger('RenderAssetPreview', DEBUG_ENABLED);

export default function RenderAssetPreview() {
  const chainId = useChainId();
  const ctx: any = useAssetSelectionContext();

  const {
    inputState,
    validatedAsset,
    setValidatedAsset,          // provider-side setter
    setInputState,              // advance FSM to UPDATE_VALIDATED_ASSET
    feedType,
    setManualEntry,
  } = ctx;

  // Always declare hooks unconditionally at the top to preserve order
  const [avatarSrc, setAvatarSrc] = useState<string>(defaultMissingImage);

  // Resolve avatarSrc asynchronously when appropriate; guard inside the effect
  useEffect(() => {
    let cancelled = false;

    const resolveLogo = async () => {
      const visible = isRenderFSMState(inputState);
      if (!visible || !validatedAsset) return;

      const address = validatedAsset.address as string | undefined;

      // Default while resolving
      setAvatarSrc((prev) => prev || defaultMissingImage);

      if (feedType === FEED_TYPE.TOKEN_LIST) {
        if (!address) {
          if (!cancelled) setAvatarSrc(defaultMissingImage);
          return;
        }
        try {
          const url = await getLogoURL(chainId, address as Address, FEED_TYPE.TOKEN_LIST);
          if (!cancelled) {
            setAvatarSrc(url || defaultMissingImage);
            debugLog.log('🖼️ Resolved token logo', { chainId, address, url });
          }
        } catch (e) {
          if (!cancelled) {
            setAvatarSrc(defaultMissingImage);
            debugLog.warn('⚠️ getLogoURL failed; using fallback', { chainId, address, error: e });
          }
        }
      } else {
        // Accounts/agents: construct synchronously
        const url =
          validatedAsset.logoURL ||
          (address ? `/assets/accounts/${address}/logo.png` : '') ||
          defaultMissingImage;
        if (!cancelled) setAvatarSrc(url);
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

    try {
      // Future picks shouldn’t reopen preview
      setManualEntry?.(false);

      // Ensure chainId/address present on the committed object
      const assetToCommit: any = { ...validatedAsset };
      if (!assetToCommit.address) assetToCommit.address = address as Address;
      if (!assetToCommit.chainId) assetToCommit.chainId = chainId;

      // 1) Commit to provider context
      if (typeof setValidatedAsset === 'function') {
        setValidatedAsset(assetToCommit);
        debugLog.log('✅ setValidatedAsset dispatched', {
          address: assetToCommit.address,
          chainId: assetToCommit.chainId,
          symbol: assetToCommit.symbol,
          name: assetToCommit.name,
        });
      } else {
        debugLog.warn('⚠️ setValidatedAsset not available in context');
      }

      // 2) Let FSM terminal logic run (provider should handle UPDATE → CLOSE)
      setInputState(
        InputState.UPDATE_VALIDATED_ASSET,
        'RenderAssetPreview → UPDATE_VALIDATED_ASSET'
      );
    } catch (err) {
      debugLog.error('❌ Failed to dispatch validated asset', err);
    }
  };

  const onInfoClick = () => {
    if (feedType === FEED_TYPE.TOKEN_LIST) {
      alert(`${name} Object:\n${stringifyBigInt(validatedAsset)}`);
    } else {
      alert(`Wallet JSON:\n${JSON.stringify(validatedAsset, null, 2)}`);
    }
  };

  const onInfoContextMenu = () => {
    if (feedType === FEED_TYPE.TOKEN_LIST) {
      alert(`${name} Logo URL: ${avatarSrc}`);
    } else {
      alert(`${name} Record:\n${stringifyBigInt(validatedAsset.logoURL || '')}`);
    }
  };

  return (
    <div id="RenderAssetPreview" className="w-full">
      <BasePreviewWrapper show={true}>
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
