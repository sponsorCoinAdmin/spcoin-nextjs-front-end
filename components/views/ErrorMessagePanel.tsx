// File: components/views/ErrorMessagePanel.tsx

import { useCallback } from 'react';

import { useExchangeContext } from '@/lib/context/hooks';
import type { ErrorMessage } from '@/lib/structure';
import { debugHookChange } from '@/lib/utils/debugHookChange';

/**
 * Shallow equality check for ErrorMessage objects.
 * We compare the core fields so we don't re-set the same error
 * and cause unnecessary renders / potential loops.
 */
const areErrorMessagesEqual = (
  a: ErrorMessage | undefined,
  b: ErrorMessage | undefined
): boolean => {
  if (a === b) return true;
  if (!a && !b) return true;
  if (!a || !b) return false;

  return (
    a.errCode === b.errCode &&
    a.msg === b.msg &&
    a.source === b.source &&
    a.status === b.status
  );
};

/**
 * Access and update the generic user-facing error message.
 * Typically used for validation or user interaction errors.
 */
export const useErrorMessage = (): [
  ErrorMessage | undefined,
  (error: ErrorMessage | undefined) => void
] => {
  const { errorMessage, setErrorMessage } = useExchangeContext();

  const setDebuggedErrorMessage = useCallback(
    (error: ErrorMessage | undefined) => {
      if (areErrorMessagesEqual(errorMessage, error)) {
        // No-op if the error didn't actually change, to avoid
        // unnecessary renders and potential update loops.
        return;
      }

      debugHookChange('errorMessage', errorMessage, error);
      setErrorMessage(error);
    },
    [errorMessage, setErrorMessage]
  );

  return [errorMessage, setDebuggedErrorMessage];
};

/**
 * Access and update the API-specific error message.
 * Typically used for network or backend error responses.
 */
export const useApiErrorMessage = (): [
  ErrorMessage | undefined,
  (error: ErrorMessage | undefined) => void
] => {
  const { apiErrorMessage, setApiErrorMessage } = useExchangeContext();

  const setDebuggedApiErrorMessage = useCallback(
    (error: ErrorMessage | undefined) => {
      if (areErrorMessagesEqual(apiErrorMessage, error)) {
        // No-op if the error didn't actually change.
        return;
      }

      debugHookChange('apiErrorMessage', apiErrorMessage, error);
      setApiErrorMessage(error);
    },
    [apiErrorMessage, setApiErrorMessage]
  );

  return [apiErrorMessage, setDebuggedApiErrorMessage];
};
