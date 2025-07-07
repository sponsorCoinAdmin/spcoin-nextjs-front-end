// File: components/views/ErrorView.tsx

'use client';

import { useErrorMessage } from '@/lib/context/hooks';
import { ErrorDialog } from '@/components/Dialogs/Dialogs';

export default function ErrorView() {
  const [errorMessage, setErrorMessage] = useErrorMessage();

  return (
    <ErrorDialog
      showDialog={true}
      closeDialog={() => setErrorMessage(undefined)}
      message={errorMessage}
    />
  );
}
