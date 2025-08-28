// File: components/containers/NetworkSelect.tsx
'use client';

import React, { useEffect, useMemo, useCallback } from 'react';
import styles from '@/styles/Header.module.css';
import { ChevronDown } from 'lucide-react';
import networks from '@/lib/network/initialize/networks.json';
import { hideElement, showElement, toggleElement } from '@/lib/spCoin/guiControl';

import { useExchangeContext } from '@/lib/context/hooks'; // keep your existing import
import { useSetAppChainId } from '@/lib/context/hooks/nestedHooks/useAppChainId'; // or from your new barrel

type NetworkLike = {
  name?: string;
  logoURL?: string;
  chainId?: number;
} | null | undefined;

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

  const setAppChainId = useSetAppChainId();

  useEffect(() => {
    disabled ? hideElement(selectId) : showElement(selectId);
  }, [disabled, selectId]);

  const handlePick = useCallback(
    (newChainId: number) => {
      setAppChainId(newChainId);
      toggleElement(menuId);
    },
    [setAppChainId, menuId]
  );

  const networkOptions = useMemo(
    () =>
      (networks as any[]).map((net) => (
        <button
          key={net.chainId}
          type="button"
          className="w-full text-left mb-1 mt-1 ml-1 mr-1 pt-1 px-0 hover:bg-spCoin_Blue-900"
          onClick={() => handlePick(net.chainId)}
        >
          <div className={styles.networkSelect}>
            <img
              src={net.img}
              alt={net.symbol || String(net.chainId)}
              className="h-9 w-9 mr-2 rounded-md"
            />
            <div>{net.name}</div>
          </div>
        </button>
      )),
    [handlePick]
  );

  const onTriggerKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleElement(menuId);
      }
    },
    [menuId]
  );

  return (
    <div className="relative inline-flex items-center">
      <div
        className={styles.networkSelect}
        tabIndex={0}
        onClick={() => toggleElement(menuId)}
        onKeyDown={onTriggerKeyDown}
      >
        <img
          alt={effectiveNetwork?.name ?? 'Network'}
          className="h-9 w-9 mr-2 rounded-md cursor-pointer"
          src={effectiveNetwork?.logoURL ?? ''}
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
