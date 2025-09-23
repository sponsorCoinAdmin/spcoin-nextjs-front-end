// File: components/containers/ErrorMessagePanel.tsx
'use client';

import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { useErrorMessage } from '@/lib/context/hooks';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { SP_COIN_DISPLAY } from '@/lib/structure';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_ERROR_MESSAGE_PANEL === 'true';
const debugLog = createDebugLogger('ErrorMessagePanel', DEBUG_ENABLED, LOG_TIME);

interface ErrorMessagePanelProps {
  /** Whether this panel should be visible (parent controls via panel tree) */
  isActive: boolean;
  /** @deprecated Previously used to close parent; no longer needed. */
  closePanelCallback?: () => void;
}

function ErrorMessagePanelInner() {
  const [errorMessage, setErrorMessage] = useErrorMessage();
  const { openPanel } = usePanelTree();

  const onDismiss = () => {
    debugLog.log('✅ Dismiss ErrorMessagePanel → openPanel(TRADING_STATION_PANEL) & clear error');
    setErrorMessage(undefined);
    // Return to Trading Station overlay
    openPanel(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
  };

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

export default function ErrorMessagePanel({ isActive }: ErrorMessagePanelProps) {
  debugLog.log('🛠️ ErrorMessagePanel render; isActive=', isActive);
  if (!isActive) {
    debugLog.log('⏭️ ErrorMessagePanel → not active, skipping render');
    return null;
  }
  return <ErrorMessagePanelInner />;
}
