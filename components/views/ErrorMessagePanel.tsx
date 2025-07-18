// File: components/views/ErrorMessagePanel.tsx

'use client';

import { useErrorMessage, useActiveDisplay, useExchangeContext } from '@/lib/context/hooks';
import { ErrorDialog } from '@/components/Dialogs/Dialogs';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { getActiveDisplayString } from '@/lib/context/helpers/activeDisplayHelpers';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_ERROR_MESSAGE_PANEL === 'true';
const debugLog = createDebugLogger('ErrorMessagePanel', DEBUG_ENABLED, LOG_TIME);

function ErrorMessagePanelInner() {
  const [errorMessage, setErrorMessage] = useErrorMessage();
  const { updateActiveDisplay } = useActiveDisplay();
  const { exchangeContext } = useExchangeContext();

  const closeDialog = () => {
    debugLog.log('✅ Closing ErrorMessagePanel → switching to SHOW_TRADING_STATION_PANEL');
    setErrorMessage(undefined);
    updateActiveDisplay(SP_COIN_DISPLAY.SHOW_TRADING_STATION_PANEL);
  };

  return (
    <ErrorDialog
      showDialog={true}
      closeDialog={closeDialog}
      message={errorMessage}
    />
  );
}

export default function ErrorMessagePanel() {
  const { activeDisplay } = useActiveDisplay();

  debugLog.log(
    `🛠️ ErrorMessagePanel → activeDisplay:`,
    getActiveDisplayString(activeDisplay)
  );

  const isActive = activeDisplay === SP_COIN_DISPLAY.SHOW_ERROR_MESSAGE_PANEL;

  if (!isActive) {
    debugLog.log('⏭️ ErrorMessagePanel → not active, skipping render');
    return null;
  }

  return <ErrorMessagePanelInner />;
}
