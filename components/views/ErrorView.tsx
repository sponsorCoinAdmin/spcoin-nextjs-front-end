// File: components/views/ErrorView.tsx

'use client';

import { useErrorMessage } from '@/lib/context/hooks';
import { ErrorDialog } from '@/components/Dialogs/Dialogs';
import { useExchangeContext } from '@/lib/context/hooks';
import { getActiveDisplayString } from '@/lib/context/helpers/activeDisplayHelpers'; // ✅ added

export default function ErrorView() {
  const [errorMessage, setErrorMessage] = useErrorMessage();
  const { exchangeContext } = useExchangeContext();
  const activeDisplay = exchangeContext.settings.activeDisplay; // ✅ added (non-functional)

  console.debug(
    `🛠️ ErrorView → activeDisplay:`,
    getActiveDisplayString(activeDisplay)
  ); // ✅ just log

  return (
    <ErrorDialog
      showDialog={true}
      closeDialog={() => setErrorMessage(undefined)}
      message={errorMessage}
    />
  );
}
