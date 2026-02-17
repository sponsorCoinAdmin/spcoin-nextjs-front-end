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
  textMode?: 'Summary' | 'Standard' | 'Expanded';
  confirmAssetCallback: (address: string) => void;
};

const TokenListItem = React.memo(function TokenListItem({
  name,
  symbol,
  address,
  logoURL,
  textMode = 'Standard',
  confirmAssetCallback,
}: TokenListItemProps) {
  const { openPanel } = usePanelTree();
  const [, setPreviewTokenContract] = usePreviewTokenContract();
  const [, setPreviewTokenSource] = usePreviewTokenSource();
  const buyMode = usePanelVisible(SP_COIN_DISPLAY.BUY_CONTRACT);
  const sellMode = usePanelVisible(SP_COIN_DISPLAY.SELL_CONTRACT);

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
      SP_COIN_DISPLAY.TOKEN_PANEL,
      'TokenListItem:openTokenContractPanel',
    );
    openPanel(
      SP_COIN_DISPLAY.PREVIEW_CONTRACT,
      'TokenListItem:openPreviewToken',
      SP_COIN_DISPLAY.TOKEN_PANEL,
    );
  };

  const shortAddress =
    address.length > 12 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address;

  const text = (() => {
    if (textMode === 'Summary') {
      const summaryTitle = (symbol || '').trim() || name;
      return {
        title: summaryTitle,
        subtitle: undefined as string | undefined,
      };
    }
    if (textMode === 'Expanded') {
      const expandedSubtitle = [symbol, shortAddress].filter(Boolean).join(' • ');
      return {
        title: name,
        subtitle: expandedSubtitle || shortAddress,
      };
    }
    return {
      title: name,
      subtitle: symbol,
    };
  })();

  return (
    <BaseListRow
      avatarSrc={logoURL || defaultMissingImage}
      title={text.title}
      subtitle={text.subtitle}
      onAvatarClick={() => confirmAssetCallback(address)}
      selectTitle={`Select ${name} (${symbol || 'N/A'})`}
      titleClassName="font-semibold truncate !text-[#5981F3]"
      subtitleClassName="text-sm truncate !text-[#5981F3]"  // ← force blue
      onInfoClick={openPreview}
      onInfoContextMenu={openPreview}
    />
  );
});

export default TokenListItem;
