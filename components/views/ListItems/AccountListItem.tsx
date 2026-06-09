// File: components/views/ListItems/AccountListItem.tsx
'use client';

import React, { memo, useMemo } from 'react';
import { getAccountLogo } from '@/lib/context/helpers/assetHelpers';
import type { spCoinAccount } from '@/lib/structure';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import BaseListRow from './BaseListRow';

import { createDebugLogger } from '@/lib/utils/debugLogger';
import useOpenAccountComponent, {
  type AccountComponentMode,
} from '@/lib/context/hooks/useOpenAccountComponent';

const LOG_TIME = false as const;

// pick one (or both) flags to enable logging
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_ASSET_SELECT === 'true' ||
  process.env.NEXT_PUBLIC_DEBUG_LOG_MANAGE_SPONSORS === 'true';

const debugLog = createDebugLogger('AccountListItem', DEBUG_ENABLED, LOG_TIME);

type AccountListItemProps = {
  account: spCoinAccount;
  role: string; // may be passed by parent; unused locally
  onPick: (address: string) => void; // wired to avatar click
  textMode?: 'Summary' | 'Standard' | 'Expanded';
};

function normalizeAddr(addr?: string) {
  if (!addr) return '';
  // ensures lowercase 0x prefix (fixes 0X vs 0x)
  return addr.toLowerCase().replace(/^0x/i, '0x');
}

function AccountListItem({
  account,
  onPick,
  role: _role,
  textMode = 'Standard',
}: AccountListItemProps) {
  const openAccountComponent = useOpenAccountComponent();
  const logo = getAccountLogo(account);

  const addrRaw = account?.address ?? '';
  const addrNorm = useMemo(() => normalizeAddr(addrRaw), [addrRaw]);

  // Helpful debug once per render (env-gated)
  debugLog.log?.('render', {
    name: account?.name ?? null,
    symbol: account?.symbol ?? null,
    addressRaw: addrRaw,
    addressNormalized: addrNorm,
    logoComputed: logo,
    logoURLField: (account as any)?.logoURL ?? null,
    textMode,
  });

  const shortAddress =
    addrNorm.length > 12 ? `${addrNorm.slice(0, 6)}...${addrNorm.slice(-4)}` : addrNorm;

  const text = (() => {
    const name = account.name || 'N/A';
    const symbol = account.symbol || 'N/A';

    if (textMode === 'Summary') {
      return {
        title: symbol !== 'N/A' ? symbol : name,
        subtitle: undefined as string | undefined,
      };
    }

    if (textMode === 'Expanded') {
      const expandedSubtitle = [symbol, shortAddress].filter(Boolean).join(' • ');
      return {
        title: name,
        subtitle: expandedSubtitle || symbol,
      };
    }

    return {
      title: name,
      subtitle: symbol,
    };
  })();

  const modeFromRole = (role: string): AccountComponentMode => {
    const r = role.trim().toLowerCase();
    if (r === 'recipient') return SP_COIN_DISPLAY.RECIPIENT_ACCOUNT;
    if (r === 'agent') return SP_COIN_DISPLAY.AGENT_ACCOUNT;
    if (r === 'sponsor') return SP_COIN_DISPLAY.SPONSOR_ACCOUNT;
    return SP_COIN_DISPLAY.ACTIVE_ACCOUNT;
  };

  return (
    <BaseListRow
      avatarSrc={logo}
      title={text.title}
      subtitle={text.subtitle}
      avatarClickAction="select"
      trailingControl="info"
      onAvatarClick={() => {
        debugLog.log?.('pick', { addressRaw: addrRaw, addressNormalized: addrNorm });
        onPick(account.address);
      }}
      onInfoClick={() => {
        openAccountComponent({
          account,
          mode: modeFromRole(_role),
          source: 'AccountListItem:onInfoClick',
        });
      }}
      onInfoContextMenu={() => {
        debugLog.log?.('contextMenu:noop');
      }}
    />
  );
}

export default memo(AccountListItem);
