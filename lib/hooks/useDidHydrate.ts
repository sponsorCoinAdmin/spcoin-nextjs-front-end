// File: @/lib/hooks/useDidHydrate.ts

import { useEffect, useState } from 'react';

export function useDidHydrate(): boolean {
  const [didHydrate, setDidHydrate] = useState(false);

  useEffect(() => {
    setDidHydrate(true);
  }, []);

  return didHydrate;
}
