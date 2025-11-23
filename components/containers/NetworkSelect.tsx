// File: @/components/containers/NetworkSelect.tsx
'use client';

import React, { useEffect, useMemo, useCallback } from 'react';
import styles from '@/styles/Header.module.css';
import { ChevronDown } from 'lucide-react';
import networks from '@/lib/network/initialize/networks.json';

import { useAppChainId, useExchangeContext } from '@/lib/context/hooks';
import { getBlockChainLogoURL } from '@/lib/context/helpers/NetworkHelpers';
import { hideElement, showElement, toggleElement } from '@/lib/spCoin/coreUtils';

type NetworkLike =
  | {
      name?: string;
      logoURL?: string;
      chainId?: number;
      symbol?: string;
    }
  | null
  | undefined;

type Props = {
  id: string;
  disabled?: boolean;
  /** Optional: overrides context network when provided */
  networkElement?: NetworkLike;
};

const NetworkSelect: React.FC<Props> = ({ id, disabled = false, networkElement }) => {
  const selectId = `${id}Select`;
  const menuId = `${id}-networks`;

  const { exchangeContext } = useExchangeContext();
  const ctxNetwork = exchangeContext?.network as NetworkLike;

  // Prefer explicit prop, otherwise fall back to context
  const effectiveNetwork = networkElement ?? ctxNetwork;

  // Single canonical hook → [value, setter]
  const [appChainId, setAppChainId] = useAppChainId();

  useEffect(() => {
    disabled ? hideElement(selectId) : showElement(selectId);
  }, [disabled, selectId]);

  const handlePick = useCallback(
    (newChainId: number) => {
      if (disabled) return;
      setAppChainId(newChainId);
      // toggleElement(menuId);
    },
    [disabled, setAppChainId, menuId]
  );

  const networkOptions = useMemo(
    () =>
      (networks as any[]).map((net) => {
        const optionLogo =
          net.logoURL ??
          net.img ??
          (typeof net.chainId === 'number' ? getBlockChainLogoURL(net.chainId) : '');

        return (
          <button
            key={net.chainId}
            type="button"
            className="w-full text-left mb-1 mt-1 ml-1 mr-1 pt-1 px-0 hover:bg-spCoin_Blue-900 disabled:opacity-60"
            onClick={() => handlePick(net.chainId)}
            disabled={disabled}
          >
            <div className={styles.networkSelect}>
              <img
                src={optionLogo}
                alt={net.symbol || net.name || String(net.chainId)}
                className="h-9 w-9 mr-2 rounded-md"
              />
              <div>{net.name ?? net.symbol ?? net.chainId}</div>
            </div>
          </button>
        );
      }),
    [handlePick, disabled]
  );

  const onTriggerKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleElement(menuId);
      }
    },
    [disabled, menuId]
  );

  // Fallback logo if the context-provided one is missing
  const currentLogo =
    effectiveNetwork?.logoURL ??
    (typeof appChainId === 'number' ? getBlockChainLogoURL(appChainId) : '');

  return (
    <div className="relative inline-flex items-center">
      <div
        className={styles.networkSelect}
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled ? 'true' : 'false'}
        onClick={() => !disabled && toggleElement(menuId)}
        onKeyDown={onTriggerKeyDown}
      >
        <img
          alt={effectiveNetwork?.name ?? 'Network'}
          className="h-9 w-9 mr-2 rounded-md cursor-pointer"
          src={currentLogo}
        />
        {effectiveNetwork?.name ?? 'Network'}
        <ChevronDown id={selectId} size={16} className="ml-2 cursor-pointer" />
      </div>

      <ul
        id={menuId}
        className={`${styles.networks} absolute right-0 top-[calc(100%+6px)] z-50`}
        data-menu
      >
        {networkOptions}
      </ul>
    </div>
  );
};

export default NetworkSelect;
