// File: components/views/ErrorMessagePanel.tsx
'use client';

import { useErrorMessage, useActiveDisplay } from '@/lib/context/hooks';
import { ErrorDialog } from '@/components/Dialogs/Dialogs';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { getActiveDisplayString } from '@/lib/context/helpers/activeDisplayHelpers';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_ERROR_MESSAGE_PANEL === 'true';
const debugLog = createDebugLogger('ErrorMessagePanel', DEBUG_ENABLED, LOG_TIME);

interface ErrorMessagePanelProps {
  isActive: boolean;
  closePanelCallback: () => void;
}

function ErrorMessagePanelInner({
  closePanelCallback,
}: {
  closePanelCallback: () => void;
}) {
  const [errorMessage, setErrorMessage] = useErrorMessage();
  const { setActiveDisplay } = useActiveDisplay();

  const closeDialog = () => {
    debugLog.log('✅ Closing ErrorMessagePanel → switching to TRADING_STATION_PANEL');
    setErrorMessage(undefined);
    setActiveDisplay(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
    closePanelCallback();
  };

  return (
    <ErrorDialog
      showDialog={true}
      closeDialog={closeDialog}
      message={errorMessage}
    />
  );
}

export default function ErrorMessagePanel({
  isActive,
  closePanelCallback,
}: ErrorMessagePanelProps) {
  const { activeDisplay } = useActiveDisplay();

  debugLog.log(
    '🛠️ ErrorMessagePanel → activeDisplay:',
    getActiveDisplayString(activeDisplay)
  );

  if (!isActive) {
    debugLog.log('⏭️ ErrorMessagePanel → not active or display hidden, skipping render');
    return null;
  }

  return <ErrorMessagePanelInner closePanelCallback={closePanelCallback} />;
}
