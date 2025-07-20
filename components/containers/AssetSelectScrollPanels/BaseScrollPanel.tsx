// File: components/containers/AssetSelectScrollPanels/BaseScrollPanel.tsx

'use client';

import React, { useCallback } from 'react';
import styles from '@/styles/Modal.module.css';
import { InputState, FEED_TYPE, SP_COIN_DISPLAY } from '@/lib/structure';
import { useActiveDisplay} from '@/lib/context/hooks';
import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/useSharedPanelContext';

export default function BaseScrollPanel({
  id,
  title,
  children,
  feedType = FEED_TYPE.TOKEN_LIST,
  containerType = SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  feedType?: FEED_TYPE;
  containerType?: SP_COIN_DISPLAY;
}) {
  const { setActiveDisplay } = useActiveDisplay(); // ✅ only activeDisplay now
  const { setInputState } = useSharedPanelContext();

  const closeScrollPanel = useCallback(() => {
    setActiveDisplay(SP_COIN_DISPLAY.TRADING_STATION_PANEL); // ✅ switch back to main panel
  }, [setInputState, setActiveDisplay]);

  return (
    <div
      id={id}
      className={styles.baseSelectPanel}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${id}-title`}
    >
      <div id="BaseScrollPanel" className="relative h-8 px-3 mb-1 text-gray-600">
        <h1
          id={`${id}-title`}
          className="absolute left-1/2 bottom-0 translate-x-[-50%] text-lg"
        >
          {title}
        </h1>
        <button
          id="closeScrollPanelButton"
          aria-label="Close dialog"
          onClick={closeScrollPanel}
          className="absolute right-2 -translate-y-1/2 cursor-pointer rounded border-none w-5 text-xl text-white hover:text-gray-400"
        >
          X
        </button>
      </div>
      <div className={`${styles.modalBox} flex flex-col h-full max-h-[80vh] min-h-0`}>
        {children}
      </div>
    </div>
  );
}
