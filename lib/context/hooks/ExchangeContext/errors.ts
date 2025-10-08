import { useExchangeContext } from '@/lib/context/hooks';
import type { ErrorMessage } from '@/lib/structure';

export const useErrorMessage = (): [ErrorMessage | undefined, (e: ErrorMessage | undefined) => void] => {
  const { errorMessage, setErrorMessage } = useExchangeContext();
  return [errorMessage, setErrorMessage];
};

export const useApiErrorMessage = (): [ErrorMessage | undefined, (e: ErrorMessage | undefined) => void] => {
  const { apiErrorMessage, setApiErrorMessage } = useExchangeContext();
  return [apiErrorMessage, setApiErrorMessage];
};
