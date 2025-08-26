// File: components/containers/NetworkSelect.tsx
'use client';

import React, { useEffect, useMemo, useCallback } from 'react';
import styles from '@/styles/Header.module.css';
import { ChevronDown } from 'lucide-react';
import { NetworkElement } from '@/lib/structure';
import { hideElement, showElement, toggleElement } from '@/lib/spCoin/guiControl';
import networks from '@/lib/network/initialize/networks.json';
import { useSetLocalChainId } from '@/lib/context/hooks/nestedHooks/useLocalChainId';

type Props = {
  networkElement: NetworkElement;
  id: string;
  disabled: boolean;
};

const NetworkSelect: React.FC<Props> = ({ networkElement, id, disabled }) => {
  const selectId = `${id}Select`;
  const menuId = `${id}-networks`;
  const cx = styles as unknown as Record<string, string>;
  const setLocalChainId = useSetLocalChainId();

  useEffect(() => {
    disabled ? hideElement(selectId) : showElement(selectId);
  }, [disabled, selectId]);

  const handlePick = useCallback(
    (newChainId: number) => {
      setLocalChainId(newChainId);
      // Close the dropdown after picking
      toggleElement(menuId);
    },
    [setLocalChainId, menuId]
  );

  const networkOptions = useMemo(
    () =>
      (networks as any[]).map((net) => (
        <button
          type="button"
          key={net.chainId}
          className="mb-1 mt-1 ml-1 mr-1 pt-1 px-0 hover:bg-spCoin_Blue-900 w-full text-left"
          onClick={() => handlePick(net.chainId)}
        >
          <div className={cx['networkSelect']}>
            <img
              src={net.img}
              alt={net.symbol || String(net.chainId)}
              className="h-9 w-9 mr-2 rounded-md"
            />
            <div>{net.name}</div>
          </div>
        </button>
      )),
    [handlePick, cx]
  );

  return (
    <div className="inline-flex items-center relative">
      {/* Force non-absolute positioning via Tailwind utility */}
      <div className={`${cx['dropdown-content']} static`} aria-disabled={disabled}>
        <div className={cx['networkSelect']}>
          <img
            alt={networkElement?.name ?? 'Network'}
            className="h-9 w-9 mr-2 rounded-md cursor-pointer"
            src={networkElement?.logoURL ?? ''}
            onClick={() => toggleElement(menuId)}
          />
          {networkElement?.name ?? 'Network'}
          <ChevronDown
            id={selectId}
            size={16}
            onClick={() => toggleElement(menuId)}
            className="ml-2 cursor-pointer"
          />
        </div>

        <div id={menuId} className={cx['networks']}>
          {networkOptions}
        </div>
      </div>
    </div>
  );
};

export default NetworkSelect;
