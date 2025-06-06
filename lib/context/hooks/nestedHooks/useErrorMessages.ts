// File: lib/context/hooks/nestedHooks/useErrorMessages.ts

import { useExchangeContext } from '@/lib/context/hooks';
import { ErrorMessage } from '@/lib/structure';

/**
 * Access and update the generic user-facing error message.
 * Typically used for validation or user interaction errors.
 */
export const useErrorMessage = (): [ErrorMessage | undefined, (error: ErrorMessage | undefined) => void] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  const setErrorMessage = (error: ErrorMessage | undefined) => {
    setExchangeContext(prev => ({
      ...prev,
      errorMessage: error,
    }));
  };

  return [exchangeContext.errorMessage, setErrorMessage];
};

/**
 * Access and update the API-specific error message.
 * Typically used for network or backend error responses.
 */
export const useApiErrorMessage = (): [ErrorMessage | undefined, (error: ErrorMessage | undefined) => void] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  const setApiErrorMessage = (error: ErrorMessage | undefined) => {
    setExchangeContext(prev => ({
      ...prev,
      apiErrorMessage: error,
    }));
  };

  return [exchangeContext.apiErrorMessage, setApiErrorMessage];
};
