// File: @/components/views/ListItems/AccountListItem.tsx
'use client';

import React, { memo, useMemo } from 'react';
import { getAccountLogo } from '@/lib/context/helpers/assetHelpers';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import type { WalletAccount } from '@/lib/structure';
import BaseListRow from './BaseListRow';

import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false as const;

// pick one (or both) flags to enable logging
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_ASSET_SELECT === 'true' ||
  process.env.NEXT_PUBLIC_DEBUG_LOG_MANAGE_SPONSORS === 'true';

const debugLog = createDebugLogger('AccountListItem', DEBUG_ENABLED, LOG_TIME);

type AccountListItemProps = {
  account: WalletAccount;
  role: string; // may be passed by parent; unused locally
  onPick: (address: string) => void; // wired to avatar click
};

function normalizeAddr(addr?: string) {
  if (!addr) return '';
  // ensures lowercase 0x prefix (fixes 0X vs 0x)
  return addr.toLowerCase().replace(/^0x/i, '0x');
}

function AccountListItem({ account, onPick, role: _role }: AccountListItemProps) {
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
  });

  return (
    <BaseListRow
      avatarSrc={logo}
      title={account.name || 'N/A'}
      subtitle={account.symbol || 'N/A'}
      onAvatarClick={() => {
        debugLog.log?.('pick', { addressRaw: addrRaw, addressNormalized: addrNorm });
        onPick(account.address);
      }}
      onInfoClick={() => {
        alert(`Wallet JSON:\n${JSON.stringify(account, null, 2)}`);
      }}
      onInfoContextMenu={() => {
        alert(`${account.name} Record:\n${stringifyBigInt(account.logoURL || '')}`);
      }}
    />
  );
}

export default memo(AccountListItem);
