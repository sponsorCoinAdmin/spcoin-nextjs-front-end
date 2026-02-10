// File: @/components/views/ListItems/TokenListItem.tsx
'use client';

import React from 'react';
import BaseListRow from './BaseListRow';
import { defaultMissingImage } from '@/lib/context/helpers/assetHelpers';
import { usePanelTree, usePreviewTokenContract, usePreviewTokenSource } from '@/lib/context/hooks';
import { SP_COIN_DISPLAY, type TokenContract } from '@/lib/structure';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';

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
  const [, setPreviewTokenSource] = usePreviewTokenSource();
  const buyMode = usePanelVisible(SP_COIN_DISPLAY.BUY_TOKEN);
  const sellMode = usePanelVisible(SP_COIN_DISPLAY.SELL_TOKEN);

  const previewToken = (): TokenContract => ({
    address: address as any,
    name,
    symbol,
    logoURL,
    balance: 0n,
  });

  const openPreview = () => {
    const token = previewToken();
    setPreviewTokenSource(buyMode ? 'BUY' : sellMode ? 'SELL' : null);
    setPreviewTokenContract(token);
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
