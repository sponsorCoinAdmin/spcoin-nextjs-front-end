// File: components/utility/PanelGate.tsx
'use client';

import React from 'react';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';

/**
 * PanelGate
 *
 * Controls whether a panel's children are mounted and/or visible based on the
 * PanelTree visibility for the given `panel` id.
 *
 * Props:
 * - panel: SP_COIN_DISPLAY enum value for this section.
 * - lazyLoad?: if true (default), children are only mounted when the panel is visible.
 * - mountAlways?: (deprecated alias) if true, always mount the children and just hide/show them.
 *                 Prefer `lazyLoad={false}` instead. If both are provided, `lazyLoad` wins.
 * - className?: optional wrapper class when mounted.
 *
 * Behavior:
 * - lazyLoad === true  → mount only when visible (render null otherwise).
 * - lazyLoad === false → always mount; apply `hidden` when not visible to avoid unmount churn.
 */
type Props = {
  panel: SP_COIN_DISPLAY;
  children: React.ReactNode;
  lazyLoad?: boolean;
  /** @deprecated Use `lazyLoad={false}` instead. */
  mountAlways?: boolean;
  className?: string;
};

export default function PanelGate({
  panel,
  children,
  lazyLoad,
  mountAlways,
  className,
}: Props) {
  // Back-compat mapping: if consumer passes mountAlways and not lazyLoad,
  // interpret as lazyLoad = !mountAlways
  const resolvedLazy =
    typeof lazyLoad === 'boolean'
      ? lazyLoad
      : typeof mountAlways === 'boolean'
      ? !mountAlways
      : true; // default: lazy load

  const visible = usePanelVisible(panel);

  // Lazy path: don't even mount when hidden
  if (resolvedLazy && !visible) return null;

  // Non-lazy path: keep mounted; hide when not visible
  // Use `hidden` (Tailwind) to avoid layout flashes while preserving node state.
  const wrapperClass =
    !resolvedLazy && !visible
      ? ['hidden', className].filter(Boolean).join(' ')
      : className ?? '';

  return (
    <div
      data-panel={SP_COIN_DISPLAY[panel]}
      data-visible={visible ? 'true' : 'false'}
      className={wrapperClass}
    >
      {children}
    </div>
  );
}
