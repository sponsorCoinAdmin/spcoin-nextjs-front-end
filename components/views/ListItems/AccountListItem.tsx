// File: components/views/ListItems/AccountListItem.tsx
'use client';

import React from 'react';
import { defaultMissingImage } from '@/lib/network/utils';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import type { WalletAccount } from '@/lib/structure';
import BaseListRow from './BaseListRow';

type AccountListItemProps = {
  account: WalletAccount;
  role:string;
  onPick: (address: string
  ) => void; // wired to avatar click
};

const AccountListItem = React.memo(function AccountListItem({
  account,
  onPick,
  role,
}: AccountListItemProps) {
  const logo =
    account.logoURL ||
    (account.address ? `/assets/accounts/${account.address}/logo.png` : '') ||
    defaultMissingImage;

  return (
    <BaseListRow
      avatarSrc={logo}
      title={account.name || 'N/A'}
      subtitle={account.symbol || 'N/A'}
      onAvatarClick={() => onPick(account.address)}
      onInfoClick={() => {
        alert(`Wallet JSON:\n${JSON.stringify(account, null, 2)}`);
      }}
      onInfoContextMenu={() => {
        alert(`${account.name} Record:\n${stringifyBigInt(account.logoURL || '')}`);
      }}
    />
  );
});

export default AccountListItem;
