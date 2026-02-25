// File: @/components/views/ErrorMessagePanel.tsx
'use client';

import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { useErrorMessage } from '@/lib/context/hooks';
import { SP_COIN_DISPLAY } from '@/lib/structure';

function ErrorMessagePanelInner() {
  const [errorMessage] = useErrorMessage();
  const isUnsupportedNetworkError =
    errorMessage?.source === 'useNetworkController:onChainChanged';
  const rawMsg = errorMessage?.msg ?? 'An unexpected error occurred.';
  const lines = rawMsg.split('\n');
  const firstLine = lines[0]?.trim() ?? '';
  const body = lines.slice(1).join('\n').replace(/^\n+/, '');
  const title = isUnsupportedNetworkError
    ? firstLine || 'Network not supported on "Sponsor Coin"'
    : 'Something went wrong';
  const bodyText = isUnsupportedNetworkError ? body : rawMsg;

  const hasDetails = Boolean(errorMessage?.source);

  return (
    <div
      id="ERROR_MESSAGE_PANEL"
      className={`flex flex-col ${
        isUnsupportedNetworkError ? 'gap-1' : 'gap-3'
      } w-full rounded-[15px] overflow-hidden p-4 border border-red-500/40 bg-red-900/20 text-red-100`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">{title}</h3>
      </div>

      <p
        className={`text-sm leading-relaxed whitespace-pre-line ${
          isUnsupportedNetworkError ? 'mt-2' : ''
        }`}
      >
        {bodyText}
      </p>

      {hasDetails && (
        <div className="text-xs opacity-80 mt-2">
          {errorMessage?.source && (
            <div>
              <span className="font-medium">Source:</span> {errorMessage.source}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ErrorMessagePanel() {
  const visible = usePanelVisible(SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL);
  if (!visible) return null;
  return <ErrorMessagePanelInner />;
}
