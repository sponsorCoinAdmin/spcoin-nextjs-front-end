// File: lib/context/hooks/nestedHooks/useErrorMessages.ts

import { useExchangeContext } from '@/lib/context/hooks/contextHooks';
import { ErrorMessage } from '@/lib/structure/types';

/**
 * Access and update the generic user-facing error message.
 * Typically used for validation or user interaction errors.
 */
export const useErrorMessage = (): [ErrorMessage | undefined, (error: ErrorMessage | undefined) => void] => {
  const { errorMessage, setErrorMessage } = useExchangeContext();
  return [errorMessage, setErrorMessage];
};

/**
 * Access and update the API-specific error message.
 * Typically used for network or backend error responses.
 */
export const useApiErrorMessage = (): [ErrorMessage | undefined, (error: ErrorMessage | undefined) => void] => {
  const { apiErrorMessage, setApiErrorMessage } = useExchangeContext();
  return [apiErrorMessage, setApiErrorMessage];
};
