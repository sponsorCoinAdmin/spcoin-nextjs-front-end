// File: @/components/views/ListItems/TokenListItem.tsx
'use client';

import React from 'react';
import BaseListRow from './BaseListRow';
import { defaultMissingImage } from '@/lib/context/helpers/assetHelpers';
import { usePanelTree, usePreviewTokenContract } from '@/lib/context/hooks';
import { SP_COIN_DISPLAY, type TokenContract } from '@/lib/structure';

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
  const { openPanel, closePanel } = usePanelTree();
  const [, setPreviewTokenContract] = usePreviewTokenContract();

  const previewToken = (): TokenContract => ({
    address: address as any,
    name,
    symbol,
    logoURL,
    balance: 0n,
  });

  const openPreview = () => {
    setPreviewTokenContract(previewToken());
    closePanel(
      SP_COIN_DISPLAY.TOKEN_LIST_SELECT_PANEL,
      'TokenListItem:openPreviewToken:closeList',
    );
    openPanel(
      SP_COIN_DISPLAY.TOKEN_CONTRACT_PANEL,
      'TokenListItem:openTokenContractPanel',
    );
    openPanel(
      SP_COIN_DISPLAY.PREVIEW_TOKEN,
      'TokenListItem:openPreviewToken',
      SP_COIN_DISPLAY.TOKEN_CONTRACT_PANEL,
    );
  };

  return (
    <BaseListRow
      avatarSrc={logoURL || defaultMissingImage}
      title={name}
      subtitle={symbol}
      onAvatarClick={() => confirmAssetCallback(address)}
      titleClassName="font-semibold truncate !text-[#5981F3]"
      subtitleClassName="text-sm truncate !text-[#5981F3]"  // ← force blue
      onInfoClick={openPreview}
      onInfoContextMenu={openPreview}
    />
  );
});

export default TokenListItem;
