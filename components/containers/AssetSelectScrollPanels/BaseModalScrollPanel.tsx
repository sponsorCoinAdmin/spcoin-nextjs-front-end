// File: components/containers/AssetSelectScrollPanels/BaseModalScrollPanel.tsx

'use client';

import React, { useCallback } from 'react';
import styles from '@/styles/Modal.module.css';
import { InputState, SP_COIN_DISPLAY, FEED_TYPE, CONTAINER_TYPE } from '@/lib/structure';
import { useActiveDisplay} from '@/lib/context/hooks';
import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/useSharedPanelContext';

export default function BaseModalScrollPanel({
  id,
  title,
  children,
  feedType = FEED_TYPE.TOKEN_LIST,
  containerType = CONTAINER_TYPE.SELL_SELECT_CONTAINER,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  feedType?: FEED_TYPE;
  containerType?: CONTAINER_TYPE;
}) {
  const { updateActiveDisplay } = useActiveDisplay(); // ✅ only activeDisplay now
  const { setInputState } = useSharedPanelContext();

  const closeDialog = useCallback(() => {
    setInputState(InputState.CLOSE_SELECT_SCROLL_PANEL);
    updateActiveDisplay(SP_COIN_DISPLAY.SHOW_TRADING_STATION_PANEL); // ✅ switch back to main panel
  }, [setInputState, updateActiveDisplay]);

  return (
    <div
      id={id}
      className={styles.addressSelectPanel}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${id}-title`}
    >
      <div className="relative h-8 px-3 mb-1 text-gray-600">
        <h1
          id={`${id}-title`}
          className="absolute left-1/2 bottom-0 translate-x-[-50%] text-lg"
        >
          {title}
        </h1>
        <button
          aria-label="Close dialog"
          onClick={closeDialog}
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
