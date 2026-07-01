'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Address } from 'viem';
import { SP_COIN_DISPLAY, STATUS, type spCoinAccount } from '@/lib/structure';
import useOpenAccountComponent from '@/lib/context/hooks/useOpenAccountComponent';
import type { AccountComponentMode } from '@/lib/context/hooks/useOpenAccountComponent';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { useWalletAccountsList } from '@/components/wallet/lib/useWalletAccountsList';
import type { SpCoinWalletAccount } from '@/components/wallet/lib/types';
import { defaultMissingImage } from '@/lib/context/helpers/assetHelpers';

type AccountAvatarProps = {
  account?: spCoinAccount;
  mode?: AccountComponentMode;
  logoURL?: string;
  symbol?: string;
  name?: string;
  address?: string;
  className?: string;
  title?: string;
  onClick?: (e: React.MouseEvent) => void;
};

export default function AccountAvatar({
  account,
  mode = SP_COIN_DISPLAY.ACTIVE_ACCOUNT,
  logoURL,
  symbol,
  name,
  address,
  className = 'h-10 w-10 object-contain',
  title,
  onClick,
}: AccountAvatarProps) {
  const openAccountComponent = useOpenAccountComponent();
  const { openPanel } = usePanelTree();
  const { visibleAccounts } = useWalletAccountsList();

  const resolvedLogo = (account?.logoURL ?? logoURL)?.trim() || defaultMissingImage;
  const resolvedSymbol = account?.symbol ?? symbol;
  const resolvedName   = account?.name ?? name;
  const resolvedAddress = account ? String(account.address ?? '') : (address ?? '');

  const [src, setSrc] = useState(resolvedLogo);
  useEffect(() => { setSrc(resolvedLogo); }, [resolvedLogo]);

  const tooltip = title ?? ([resolvedSymbol, resolvedName].filter(Boolean).join(': ') || resolvedAddress || '');

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();

    if (onClick) {
      onClick(e);
      return;
    }

    if (account) {
      openAccountComponent({ account, mode, source: 'AccountAvatar:click' });
      return;
    }

    // Look up by address in the wallet list and construct a minimal spCoinAccount
    if (resolvedAddress) {
      const found = visibleAccounts.find(
        (a: SpCoinWalletAccount) => a.address.toLowerCase() === resolvedAddress.toLowerCase()
      );
      if (found) {
        const minimal: spCoinAccount = {
          name:        found.name ?? found.label ?? '',
          symbol:      found.symbol ?? '',
          type:        '',
          website:     found.website ?? '',
          description: found.description ?? '',
          status:      STATUS.CONNECTED,
          address:     found.address as Address,
          logoURL:     found.logoURL,
          balance:     0n,
        };
        openAccountComponent({ account: minimal, mode, source: 'AccountAvatar:click' });
        return;
      }
    }

    openPanel(SP_COIN_DISPLAY.ACCOUNT_PANEL, 'AccountAvatar:click');
  }, [onClick, account, mode, resolvedAddress, visibleAccounts, openAccountComponent, openPanel]);

  return (
    <img
      src={src}
      alt={tooltip || 'Account'}
      title={tooltip}
      className={`cursor-pointer ${className}`}
      onError={() => setSrc(defaultMissingImage)}
      onClick={handleClick}
    />
  );
}
