// File: components/containers/AssetSelectPanels/BaseSelectPanel.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { clsx } from 'clsx';

import styles from '@/styles/Exchange.module.css';
import cog_png from '@/public/assets/miscellaneous/cog.png';

import { WalletAccount } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { getPublicFileUrl } from '@/lib/spCoin/guiUtils';

// ✅ New local (nested) display system only
import { useAssetSelectDisplay } from '@/lib/context/providers/AssetSelect/AssetSelectDisplayProvider';
import { ASSET_SELECTION_DISPLAY } from '@/lib/structure/assetSelection';

type BaseSelectPanelProps = {
  selectedAccount?: WalletAccount;
  onClearSelect: () => void;
  onToggleConfig: () => void;
  DropDownComponent: React.ReactNode;
  ConfigComponent?: React.ReactNode;
  label: string;
};

const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_BASE_SELECT_PANEL === 'true';
const debugLog = createDebugLogger('BaseSelectPanel', DEBUG_ENABLED, false);

const BaseSelectPanel: React.FC<BaseSelectPanelProps> = ({
  selectedAccount,
  onClearSelect,
  onToggleConfig,
  DropDownComponent,
  ConfigComponent,
  label,
}) => {
  const [siteExists, setSiteExists] = useState(false);
  const { activeSubDisplay } = useAssetSelectDisplay();
  const isConfigOpen = activeSubDisplay === ASSET_SELECTION_DISPLAY.ASSET_PREVIEW;

  const defaultStaticFileUrl = useMemo(() => {
    const baseURL = getPublicFileUrl('assets/accounts/site-info.html');
    const url = new URL(
      '/RecipientSite',
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
    );
    const inner = `${baseURL}?${
      selectedAccount?.address ? `siteKey=${selectedAccount.address.toString().trim()}` : ''
    }`;
    url.searchParams.set('url', inner);
    return url.toString();
  }, [selectedAccount?.address]);

  useEffect(() => {
    // SSR guard
    if (typeof window === 'undefined') return;

    const raw = selectedAccount?.website?.trim();
    if (!raw || raw === 'N/A') {
      debugLog.log('🌐 skip website probe: none');
      setSiteExists(false);
      return;
    }

    // Normalize: add protocol if missing
    const hasProtocol = /^(https?:)?\/\//i.test(raw);
    const probeURL = hasProtocol ? raw : `https://${raw}`;

    let cancelled = false;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 3000);

    debugLog.log(`🌐 probing website (HEAD, no-cors): ${probeURL}`);

    fetch(probeURL, { method: 'HEAD', mode: 'no-cors', signal: controller.signal })
      // With no-cors, successful network reachability resolves as an opaque response.
      .then(() => {
        if (!cancelled) {
          debugLog.log('✅ probe resolved (opaque or ok) → siteExists=true');
          setSiteExists(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          debugLog.warn('⚠️ probe failed → siteExists=false');
          setSiteExists(false);
        }
      })
      .finally(() => window.clearTimeout(timeoutId));

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [selectedAccount?.website]);

  return (
    <>
      <div
        className={clsx(
          styles.inputs,
          styles.AccountSelectContainer,
          isConfigOpen ? styles.noBottomRadius : styles.withBottomRadius
        )}
      >
        <div className={styles.lineDivider} />
        <div className={styles.yourRecipient}>{label}</div>

        {selectedAccount && siteExists ? (
          <Link
            href={{ pathname: '/RecipientSite', query: { url: selectedAccount.website! } }}
            className={styles.recipientName}
            aria-label="Open recipient website"
          >
            {selectedAccount.name}
          </Link>
        ) : (
          <Link
            href={defaultStaticFileUrl}
            className={styles.recipientName}
            aria-label="Open default recipient site"
          >
            {selectedAccount?.name || 'No selection'}
          </Link>
        )}

        <div className={styles.recipientSelect}>{DropDownComponent}</div>

        <button
          type="button"
          aria-label="Toggle settings"
          className={styles.cogImg}
          onClick={onToggleConfig}
        >
          <Image width={20} height={20} src={cog_png} alt="Settings" />
        </button>

        <button
          id="clearSelect"
          type="button"
          aria-label="Clear selection"
          className={styles.clearSponsorSelect}
          onClick={onClearSelect}
        >
          X
        </button>
      </div>

      {isConfigOpen && ConfigComponent && <div>{ConfigComponent}</div>}
    </>
  );
};

export default BaseSelectPanel;
