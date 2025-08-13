// File: components/containers/AssetSelectPanels/BaseSelectPanel.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { clsx } from 'clsx';

import styles from '@/styles/Exchange.module.css';
import cog_png from '@/public/assets/miscellaneous/cog.png';

import { SP_COIN_DISPLAY_NEW, WalletAccount } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { getPublicFileUrl } from '@/lib/spCoin/guiUtils';
import { getActiveDisplayString } from '@/lib/context/helpers/activeDisplayHelpers';

type BaseSelectPanelProps = {
  displayState: SP_COIN_DISPLAY_NEW;
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
  displayState,
  selectedAccount,
  onClearSelect,
  onToggleConfig,
  DropDownComponent,
  ConfigComponent,
  label,
}) => {
  const [siteExists, setSiteExists] = useState(false);

  const baseURL = getPublicFileUrl('assets/accounts/site-info.html');
  const sitekey = selectedAccount?.address?.toString().trim()
    ? `siteKey=${selectedAccount.address.toString().trim()}`
    : '';
  const defaultStaticFileUrl = `/RecipientSite?url=${baseURL}?${sitekey}`;

  useEffect(() => {
    const website = selectedAccount?.website;
    if (website && website !== 'N/A' && website.trim() !== '') {
      fetch(website, { method: 'HEAD', mode: 'no-cors' })
        .then(() => {
          setSiteExists(true);
          debugLog.log(`🌐 Site reachable: ${website}`);
        })
        .catch(error => {
          debugLog.warn(`⚠️ Site check failed: ${website}`, error);
          setSiteExists(false);
        });
    } else {
      setSiteExists(false);
    }
  }, [selectedAccount?.website]);

  return (
    <>
      <div
        className={clsx(
          styles.inputs,
          styles.AccountSelectContainer,
          displayState === SP_COIN_DISPLAY_NEW.SPONSOR_RATE_CONFIG_PANEL
            ? styles.noBottomRadius
            : styles.withBottomRadius
        )}
      >
        <div className={styles.lineDivider} />
        <div className={styles.yourRecipient}>{label}</div>
        {selectedAccount && siteExists ? (
          <Link
            href={`/RecipientSite?url=${selectedAccount.website}`}
            className={styles.recipientName}
          >
            {selectedAccount.name}
          </Link>
        ) : (
          <Link href={defaultStaticFileUrl} className={styles.recipientName}>
            {selectedAccount?.name || 'No selection'}
          </Link>
        )}
        <div className={styles.recipientSelect}>{DropDownComponent}</div>
        <div>
          <Image
            src={cog_png}
            className={styles.cogImg}
            width={20}
            height={20}
            alt="Settings"
            onClick={() => {
              onToggleConfig();
              debugLog.log(`⚙️ Toggled config → ${getActiveDisplayString(displayState)}`);
            }}
          />
        </div>
        <div
          id="clearSelect"
          className={styles.clearSponsorSelect}
          onClick={onClearSelect}
        >
          X
        </div>
      </div>

      {displayState === SP_COIN_DISPLAY_NEW.SPONSOR_RATE_CONFIG_PANEL && ConfigComponent && (
        <div>{ConfigComponent}</div>
      )}
    </>
  );
};

export default BaseSelectPanel;
