'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { defaultMissingImage, getTokenLogoURL } from '@/lib/context/helpers/assetHelpers';

type TokenLogoProps = {
  logoURL?: string;
  symbol?: string;
  name?: string;
  address?: string;
  chainId?: number;
  className?: string;
};

export default function TokenLogo({
  logoURL,
  symbol,
  name,
  address,
  chainId,
  className = 'h-9 w-9 object-contain',
}: TokenLogoProps) {
  const { openPanel } = usePanelTree();

  const resolved = useMemo(() => {
    const raw = logoURL?.trim();
    if (raw?.startsWith('http://') || raw?.startsWith('https://')) return raw;
    if (address && typeof chainId === 'number') return getTokenLogoURL({ address, chainId });
    return defaultMissingImage;
  }, [logoURL, address, chainId]);

  const [src, setSrc] = useState(resolved);

  useEffect(() => { setSrc(resolved); }, [resolved]);

  const tooltip = [symbol, name].filter(Boolean).join(': ') || '';

  const handleClick = useCallback(() => {
    openPanel(SP_COIN_DISPLAY.TOKEN_PANEL, 'TokenLogo:click');
  }, [openPanel]);

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
