// File: components/shared/utils/sharedPreviews/RenderAssetPreview.tsx
'use client';

import React, { useEffect, useState } from 'react';
import type { Address } from 'viem';
import BasePreviewWrapper from './BasePreviewWrapper';
import { useAssetSelectContext } from '@/lib/context/AssetSelectPanels/useAssetSelectContext';
import { isRenderFSMState } from '@/lib/hooks/inputValidations/FSM_Core/fSMInputStates';
import { FEED_TYPE } from '@/lib/structure';
import { InputState } from '@/lib/structure/assetSelection';
import { getLogoURL, defaultMissingImage } from '@/lib/network/utils';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import BaseListRow from '@/components/views/ListItems/BaseListRow';
import { useAppChainId } from '@/lib/context/hooks'; // ✅ correct source

const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ASSET_SELECT === 'true';
const debugLog = createDebugLogger('RenderAssetPreview', DEBUG_ENABLED);

export default function RenderAssetPreview() {
  const [chainId] = useAppChainId(); // ✅ tuple form
  const ctx: any = useAssetSelectContext();

  const {
    inputState,
    validatedAsset,
    setValidatedAsset,
    setInputState,
    feedType,
    setManualEntry,
    manualEntry, // ⬅️ bring it in so we can gate commit
  } = ctx;

  const [avatarSrc, setAvatarSrc] = useState<string>(defaultMissingImage);

  // DEBUG LOG TO BE REMOVED LATER
  useEffect(() => {
    console.log('[RenderAssetPreview] mount', {
      feedType,
    });
  }, [feedType]);

  // DEBUG LOG TO BE REMOVED LATER
  useEffect(() => {
    console.log('[RenderAssetPreview] state change', {
      inputState: InputState[inputState],
      hasValidatedAsset: Boolean(validatedAsset),
      manualEntry,
    });
  }, [inputState, validatedAsset, manualEntry]);

  useEffect(() => {
    let cancelled = false;

    const resolveLogo = async () => {
      const visible = isRenderFSMState(inputState);
      if (!visible || !validatedAsset) return;

      const address = validatedAsset.address as string | undefined;

      // Default while resolving/guarding
      setAvatarSrc(prev => prev || defaultMissingImage);

      // DEBUG LOG TO BE REMOVED LATER
      console.log('[RenderAssetPreview] resolveLogo start', {
        visible,
        addressPreview: address?.slice(0, 10) ?? '(none)',
        feedType: FEED_TYPE[feedType],
        chainId,
      });

      if (feedType === FEED_TYPE.TOKEN_LIST) {
        if (!address || !chainId) {
          if (!cancelled) setAvatarSrc(defaultMissingImage);
          // DEBUG LOG TO BE REMOVED LATER
          console.log('[RenderAssetPreview] resolveLogo early-exit: missing address/chainId');
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

    // DEBUG LOG TO BE REMOVED LATER
    console.log('[RenderAssetPreview] onAvatarClick', {
      manualEntry,
      addressPreview: address.slice(0, 10),
      inputState: InputState[inputState],
    });

    // 🚫 Gate: If the user is in manual-entry mode, do NOT commit directly from preview.
    if (manualEntry) {
      // DEBUG LOG TO BE REMOVED LATER
      console.log('[RenderAssetPreview] blocked commit because manualEntry===true');
      return;
    }

    try {
      // Make extra-sure the flag is false for programmatic commit paths.
      setManualEntry?.(false); // harmless if already false

      // Ensure chainId/address present on the committed object
      const assetToCommit: any = { ...validatedAsset };
      if (!assetToCommit.address) assetToCommit.address = address as Address;
      if (!assetToCommit.chainId) assetToCommit.chainId = chainId;

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
    <div id='RenderAssetPreview' className='w-full'>
      <BasePreviewWrapper show>
        <BaseListRow
          className='w-full'
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
