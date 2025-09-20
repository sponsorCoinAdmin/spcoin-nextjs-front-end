'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { clsx } from 'clsx';

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
    if (typeof window === 'undefined') return;

    const raw = selectedAccount?.website?.trim();
    if (!raw || raw === 'N/A') {
      debugLog.log('🌐 skip website probe: none');
      setSiteExists(false);
      return;
    }

    const hasProtocol = /^(https?:)?\/\//i.test(raw);
    const probeURL = hasProtocol ? raw : `https://${raw}`;

    let cancelled = false;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 3000);

    debugLog.log(`🌐 probing website (HEAD, no-cors): ${probeURL}`);

    fetch(probeURL, { method: 'HEAD', mode: 'no-cors', signal: controller.signal })
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
          'relative bg-[#1f2639] text-[#94a3b8] border-0 h-[90px] text-[25px] overflow-hidden',
          isConfigOpen ? 'rounded-b-none' : 'rounded-b-[12px]'
        )}
      >
        <div className="absolute -top-3 left-[11px] right-[11px] h-px bg-[#94a3b8] opacity-20 pointer-events-none" />

        {/* label */}
        <div className="absolute top-0 left-[11px] text-[14px] text-[#94a3b8]">{label}</div>

        {/* name link */}
        {selectedAccount && siteExists ? (
          <Link
            href={{ pathname: '/RecipientSite', query: { url: selectedAccount.website! } }}
            className="
              absolute top-[47px] left-[10px]
              min-w-[50px] h-[10px]
              text-[#94a3b8] text-[25px]
              pr-2 flex items-center justify-start gap-1
              cursor-pointer hover:text-[orange] transition-colors duration-200
            "
            aria-label="Open recipient website"
          >
            {selectedAccount.name}
          </Link>
        ) : (
          <Link
            href={defaultStaticFileUrl}
            className="
              absolute top-[47px] left-[10px]
              min-w-[50px] h-[10px]
              text-[#94a3b8] text-[25px]
              pr-2 flex items-center justify-start gap-1
              cursor-pointer hover:text-[orange] transition-colors duration-200
            "
            aria-label="Open default recipient site"
          >
            {selectedAccount?.name || 'No selection'}
          </Link>
        )}

        {/* dropdown slot */}
        <div className="absolute left-[160px] min-w-[50px] h-[25px] rounded-full flex items-center justify-start gap-1 font-bold text-[17px] pr-2 text-white bg-[#243056]">
          {DropDownComponent}
        </div>

        {/* settings (cog) button */}
        <button
          type="button"
          aria-label="Toggle settings"
          className="absolute right-[39px] inline-block transition-transform duration-300 hover:rotate-[360deg] hover:cursor-pointer"
          onClick={onToggleConfig}
        >
          <Image width={20} height={20} src={cog_png} alt="Settings" />
        </button>

        {/* clear (X) */}
        <button
          id="clearSelect"
          type="button"
          aria-label="Clear selection"
          className="absolute -top-1 right-[15px] text-[#94a3b8] text-[20px] cursor-pointer"
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
