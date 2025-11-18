// File: components/views/ListItems/TokenListItem.tsx
'use client';

import React from 'react';
import BaseListRow from './BaseListRow';
import { defaultMissingImage } from '@/lib/context/helpers/assetHelpers';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';

type TokenListItemProps = {
  name: string;
  symbol: string;
  address: string;
  logoURL?: string;
  confirmAssetCallback: (address: string) => void;
};

const TokenListItem = React.memo(function TokenListItem({
  name, symbol, address, logoURL, confirmAssetCallback,
}: TokenListItemProps) {
  return (
    <BaseListRow
      avatarSrc={logoURL || defaultMissingImage}
      title={name}
      subtitle={symbol}
      onAvatarClick={() => confirmAssetCallback(address)}
      titleClassName="font-semibold truncate !text-[#5981F3]"
      subtitleClassName="text-sm truncate !text-[#5981F3]"  // ← force blue
      onInfoClick={() => alert(`${name} Object:\n${stringifyBigInt({ name, symbol, address, logoURL })}`)}
      onInfoContextMenu={() => alert(`${name} Logo URL: ${logoURL || defaultMissingImage}`)}
    />
  );
});

export default TokenListItem;
