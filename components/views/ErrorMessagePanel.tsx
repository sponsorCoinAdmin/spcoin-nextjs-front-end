// File: @/components/containers/ErrorMessagePanel.tsx
'use client';

import { useCallback } from 'react';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { useErrorMessage } from '@/lib/context/hooks';
import { SP_COIN_DISPLAY } from '@/lib/structure';

function ErrorMessagePanelInner() {
  const [errorMessage, setErrorMessage] = useErrorMessage();

  // ✅ ERROR_MESSAGE_PANEL is a visibility overlay, not a stack pop
  const { hidePanel } = usePanelTree();

  const onDismiss = useCallback(() => {
    setErrorMessage(undefined);

    // ✅ hide only this overlay (do not pop stack, do not force-open trading)
    hidePanel(
      SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL,
      'ErrorMessagePanel:onDismiss(hide ERROR_MESSAGE_PANEL)',
    );
  }, [setErrorMessage, hidePanel]);

  const hasDetails = Boolean(errorMessage?.errCode || errorMessage?.source);

  return (
    <div
      id="ErrorMessagePanel"
      className="flex flex-col gap-3 w-full rounded-[15px] overflow-hidden p-4
                 border border-red-500/40 bg-red-900/20 text-red-100"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Something went wrong</h3>
        <button
          id="dismissErrorButton"
          type="button"
          aria-label="Dismiss error"
          onClick={onDismiss}
          className="h-6 w-6 inline-flex items-center justify-center rounded
                     border border-red-400/40 text-red-200 hover:text-white hover:border-red-300
                     transition-colors"
        >
          ×
        </button>
      </div>

      <p className="text-sm leading-relaxed">
        {errorMessage?.msg ?? 'An unexpected error occurred.'}
      </p>

      {hasDetails && (
        <div className="text-xs opacity-80">
          {errorMessage?.errCode !== undefined && (
            <div>
              <span className="font-medium">Code:</span> {errorMessage.errCode}
            </div>
          )}
          {errorMessage?.source && (
            <div>
              <span className="font-medium">Source:</span> {errorMessage.source}
            </div>
          )}
        </div>
      )}

      <div>
        <button
          type="button"
          onClick={onDismiss}
          className="px-3 py-1.5 rounded-md bg-red-600/80 hover:bg-red-600 text-white text-sm
                     transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

export default function ErrorMessagePanel() {
  const visible = usePanelVisible(SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL);
  if (!visible) return null;
  return <ErrorMessagePanelInner />;
}
