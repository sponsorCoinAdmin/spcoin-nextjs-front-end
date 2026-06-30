'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { SP_COIN_DISPLAY, type TokenContract } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { usePreviewTokenContract, usePreviewTokenSource } from '@/lib/context/hooks';
import { defaultMissingImage, getTokenLogoURL } from '@/lib/context/helpers/assetHelpers';

type TokenLogoProps = {
  tokenContract?: TokenContract;
  logoURL?: string;
  symbol?: string;
  name?: string;
  address?: string;
  chainId?: number;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLImageElement>) => void;
};

export default function TokenLogo({
  tokenContract,
  logoURL,
  symbol,
  name,
  address,
  chainId,
  className = 'h-9 w-9 object-contain',
  onClick,
}: TokenLogoProps) {
  const { openPanel } = usePanelTree();
  const [, setPreviewTokenContract] = usePreviewTokenContract();
  const [, setPreviewTokenSource] = usePreviewTokenSource();

  const resolvedLogoURL = tokenContract?.logoURL ?? logoURL;
  const resolvedSymbol  = tokenContract?.symbol ?? symbol;
  const resolvedName    = tokenContract?.name ?? name;
  const resolvedAddress = tokenContract?.address ?? address;
  const resolvedChainId = tokenContract?.chainId ?? chainId;

  const resolved = useMemo(() => {
    const raw = resolvedLogoURL?.trim();
    if (raw?.startsWith('http://') || raw?.startsWith('https://')) return raw;
    if (resolvedAddress && typeof resolvedChainId === 'number') {
      return getTokenLogoURL({ address: resolvedAddress, chainId: resolvedChainId });
    }
    if (raw && raw.length > 0) return raw.startsWith('/') ? raw : `/${raw.replace(/^\/+/, '')}`;
    return defaultMissingImage;
  }, [resolvedLogoURL, resolvedAddress, resolvedChainId]);

  const [src, setSrc] = useState(resolved);

  useEffect(() => { setSrc(resolved); }, [resolved]);

  const tooltip = [resolvedSymbol, resolvedName].filter(Boolean).join(': ') || '';

  const handleClick = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    if (onClick) { onClick(e); return; }
    if (!resolvedAddress) return;
    setPreviewTokenSource(null);
    setPreviewTokenContract({
      address: resolvedAddress as any,
      name: resolvedName || '',
      symbol: resolvedSymbol || '',
      logoURL: src,
      balance: 0n,
    });
    openPanel(SP_COIN_DISPLAY.TOKEN_PANEL, 'TokenLogo:click');
  }, [onClick, resolvedAddress, resolvedName, resolvedSymbol, src, setPreviewTokenSource, setPreviewTokenContract, openPanel]);

  return (
    <img
      src={src}
      alt={tooltip || 'Token'}
      title={tooltip}
      className={`cursor-pointer ${className}`}
      onError={() => setSrc(defaultMissingImage)}
      onClick={handleClick}
    />
  );
}
