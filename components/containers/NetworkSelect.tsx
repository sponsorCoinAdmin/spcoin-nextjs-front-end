// File: components/containers/NetworkSelect.tsx
'use client';

import React, { useEffect, useMemo, useCallback } from 'react';
import styles from '@/styles/Header.module.css';
import { ChevronDown } from 'lucide-react';
import networks from '@/lib/network/initialize/networks.json';
import { hideElement, showElement, toggleElement } from '@/lib/spCoin/guiControl';

import { useExchangeContext } from '@/lib/context/hooks';
import { useSetLocalChainId } from '@/lib/context/hooks/nestedHooks/useLocalChainId';

type Props = {
  id: string;
  /** Keep the prop so callers can disable if needed; default to enabled */
  disabled?: boolean;
};

const NetworkSelect: React.FC<Props> = ({ id, disabled = false }) => {
  const selectId = `${id}Select`;
  const menuId = `${id}-networks`;

  // 🔒 Source of truth from ExchangeContext
  const { exchangeContext } = useExchangeContext();
  const networkElement = exchangeContext?.network;

  // Request wallet/network switch (context updates via ExchangeProvider watcher)
  const setLocalChainId = useSetLocalChainId();

  useEffect(() => {
    disabled ? hideElement(selectId) : showElement(selectId);
  }, [disabled, selectId]);

  const handlePick = useCallback(
    (newChainId: number) => {
      setLocalChainId(newChainId);
      toggleElement(menuId); // close menu after selection
    },
    [setLocalChainId, menuId]
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

  // keyboard open/close for a11y
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
      {/* Trigger kept in normal flow (no absolute positioning) */}
      <div
        className={styles.networkSelect}
        role="button"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={false}
        aria-controls={menuId}
        onClick={() => toggleElement(menuId)}
        onKeyDown={onTriggerKeyDown}
      >
        <img
          alt={networkElement?.name ?? 'Network'}
          className="h-9 w-9 mr-2 rounded-md cursor-pointer"
          src={networkElement?.logoURL ?? ''}
        />
        {networkElement?.name ?? 'Network'}
        <ChevronDown id={selectId} size={16} className="ml-2 cursor-pointer" />
      </div>

      {/* Only the menu is absolutely positioned relative to the wrapper */}
      <div
        id={menuId}
        className={`${styles.networks} absolute right-0 top-[calc(100%+6px)] z-50`}
        role="listbox"
        aria-label="Select network"
      >
        {networkOptions}
      </div>
    </div>
  );
};

export default NetworkSelect;
