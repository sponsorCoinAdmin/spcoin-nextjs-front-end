// File: components/containers/NetworkSelect.tsx

'use client';

import React, { useEffect, useMemo } from 'react';
import styles from '@/styles/Header.module.css';
import { ChevronDown } from 'lucide-react';
import { NetworkElement } from '@/lib/structure/types';
import { hideElement, showElement, toggleElement } from '@/lib/spCoin/guiControl';
import networks from '@/lib/network/initialize/networks.json';

type Props = {
  networkElement: NetworkElement;
  id: string;
  disabled: boolean;
};

const NetworkSelect: React.FC<Props> = ({ networkElement, id, disabled }) => {
  const selectId = `${id}Select`;

  useEffect(() => {
    disabled ? hideElement(selectId) : showElement(selectId);
  }, [disabled, selectId]);

  const networkOptions = useMemo(
    () =>
      networks.map((network: any) => (
        <div key={network.chainId} className="mb-1 mt-1 ml-1 mr-1 pt-1 px-0 hover:bg-spCoin_Blue-900">
          <div
            className={styles.networkSelect}
            onClick={() => alert(JSON.stringify(network, null, 2))}
          >
            <img
              src={network.img}
              alt={network.symbol}
              className="h-9 w-9 mr-2 rounded-md cursor-pointer"
            />
            <div>{network.name}</div>
          </div>
        </div>
      )),
    []
  );

  return (
    <div>
      <div className={styles["dropdown-content"]}>
        <div className={styles.networkSelect}>
          <img
            alt={networkElement.name}
            className="h-9 w-9 mr-2 rounded-md cursor-pointer"
            src={networkElement.logoURL}
            onClick={() => alert(`networkElement ${JSON.stringify(networkElement, null, 2)}`)}
          />
          {networkElement.name}
          <ChevronDown
            id={selectId}
            size={16}
            onClick={() => toggleElement("networks")}
            style={{ cursor: 'pointer', marginLeft: '0.5rem' }}
          />
        </div>
        <div id="networks" className={styles.networks}>
          {networkOptions}
        </div>
      </div>
    </div>
  );
};

export default NetworkSelect;
