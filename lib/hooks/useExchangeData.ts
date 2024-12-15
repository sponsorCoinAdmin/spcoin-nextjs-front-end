import { useEffect, useState } from 'react';
import { exchangeContext } from "@/lib/context";

export const useExchangeContext = () => {
  const [exchangeData, setExchangeData] = useState(exchangeContext);

  return exchangeData;
};