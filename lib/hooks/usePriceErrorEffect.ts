// File: lib/hooks/usePriceErrorEffect.ts

'use client';

import { useEffect } from 'react';
import { usePriceAPI } from '@/lib/0X/hooks/usePriceAPI';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { useErrorMessage } from '@/lib/context/hooks';
import type { ErrorMessage } from '@/lib/structure';
import { STATUS, ERROR_CODES } from '@/lib/structure';

export function usePriceErrorEffect() {
  const { error: priceError } = usePriceAPI();
  const [_, setErrorMessage] = useErrorMessage();

  useEffect(() => {
    if (priceError) {
      const msg: ErrorMessage = {
        errCode: ERROR_CODES.PRICE_FETCH_ERROR,
        msg: (priceError as Error)?.message ?? 'Unknown price API error',
        source: 'PriceAPI',
        status: STATUS.ERROR_API_PRICE,
      };

      setErrorMessage({
        ...msg,
        msg: stringifyBigInt(msg.msg),
      });
    }
  }, [priceError, setErrorMessage]);
}
