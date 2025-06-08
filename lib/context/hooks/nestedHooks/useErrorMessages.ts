// File: lib/context/hooks/nestedHooks/useErrorMessages.ts

import { useExchangeContext } from '@/lib/context/hooks';
import { ErrorMessage } from '@/lib/structure';
import { useDebugHookChange } from '@/lib/hooks/useDebugHookChange';

/**
 * Access and update the generic user-facing error message.
 * Typically used for validation or user interaction errors.
 */
export const useErrorMessage = (): [ErrorMessage | undefined, (error: ErrorMessage | undefined) => void] => {
  const { errorMessage, setErrorMessage } = useExchangeContext();
  const debugHookChange = useDebugHookChange();

  const setDebuggedErrorMessage = (error: ErrorMessage | undefined) => {
    debugHookChange('errorMessage', errorMessage, error);
    setErrorMessage(error);
  };

  return [errorMessage, setDebuggedErrorMessage];
};

/**
 * Access and update the API-specific error message.
 * Typically used for network or backend error responses.
 */
export const useApiErrorMessage = (): [ErrorMessage | undefined, (error: ErrorMessage | undefined) => void] => {
  const { apiErrorMessage, setApiErrorMessage } = useExchangeContext();
  const debugHookChange = useDebugHookChange();

  const setDebuggedApiErrorMessage = (error: ErrorMessage | undefined) => {
    debugHookChange('apiErrorMessage', apiErrorMessage, error);
    setApiErrorMessage(error);
  };

  return [apiErrorMessage, setDebuggedApiErrorMessage];
};
