// File: components/Headers/TradeContainerHeader.tsx
'use client';

import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
// ⬇️ registry hook now returns computed values (no getCloser/getTitle/getIcon)
import { useHeaderController } from '@/lib/context/exchangeContext/hooks/useHeaderController';

export type TradeHeaderAPI = {
  setTitle: (title?: string) => void;
  setIcon: (icon?: ReactNode | string) => void;
  setCloseCallback: (cb?: () => void) => void;
  reset: () => void;
};

const DEFAULT_TITLE = 'Network';
const DEFAULT_ICON = '/assets/network-default.png';

const TradeContainerHeader = forwardRef<TradeHeaderAPI>(function TradeContainerHeader(_, ref) {
  const { activeMainOverlay, closePanel } = usePanelTree();
  const {
    title: regTitle,
    leftElement,        // optional left-side element provided by registry
    onClose: registryClose,
  } = useHeaderController();

  // Imperative API (highest precedence)
  const [titleImp, setTitleImp] = useState<string | undefined>(undefined);
  const [iconImp, setIconImp] = useState<ReactNode | string | undefined>(undefined);
  const closeCbImpRef = useRef<(() => void) | undefined>(undefined);

  useImperativeHandle(
    ref,
    () => ({
      setTitle: (t) => setTitleImp(t),
      setIcon: (i) => setIconImp(i),
      setCloseCallback: (cb) => {
        closeCbImpRef.current = cb;
      },
      reset: () => {
        setTitleImp(undefined);
        setIconImp(undefined);
        closeCbImpRef.current = undefined;
      },
    }),
    []
  );

  // Resolve values with precedence: imperative → registry → defaults
  const title = titleImp ?? regTitle ?? DEFAULT_TITLE;

  // Icon/left content:
  // - If imperative icon is set, render that.
  // - Else, if registry leftElement exists, render it in the icon slot.
  // - Else, render a default icon image.
  const iconLike: ReactNode | string = iconImp ?? leftElement ?? DEFAULT_ICON;

  const closer =
    closeCbImpRef.current ??
    registryClose ??
    (activeMainOverlay != null ? () => closePanel(activeMainOverlay) : undefined);

  const onClose = useCallback(() => {
    if (closer) closer();
  }, [closer]);

  const iconNode =
    typeof iconLike === 'string' ? <img src={iconLike} alt="" className="h-5 w-5" /> : iconLike;

  return (
    <header className="flex items-center justify-between px-3 py-2">
      <div className="flex items-center gap-2">
        {iconNode}
        <h1 className="text-base font-semibold">{title}</h1>
      </div>
      <button onClick={onClose} aria-label="Close" className="rounded p-1 hover:bg-white/10">
        ✕
      </button>
    </header>
  );
});

export default TradeContainerHeader;
