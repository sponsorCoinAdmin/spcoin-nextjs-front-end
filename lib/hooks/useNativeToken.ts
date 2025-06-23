import { useEffect, useState } from 'react';
import { TokenContract as MappedTokenContract } from '@/lib/structure';
import { createDebugLogger } from '../utils/debugLogger';
import { useLocalChainId } from '../context/hooks/nestedHooks/useLocalChainId';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_MAP_NATIVE_TOKEN_API === 'true';
const debugLog = createDebugLogger('useNativeToken', DEBUG_ENABLED, LOG_TIME);

export function useNativeToken(): MappedTokenContract | undefined {
  const [token, setToken] = useState<MappedTokenContract>();
  const chainId = useLocalChainId();
  useEffect(() => {
    if (!chainId) {
      debugLog.log('⚠️ No chainId available, skipping fetch.');
      return;
    }

    const fetchToken = async () => {
      debugLog.log(`🌐 Fetching native token from /api/native-token/${chainId}`);

      try {
        const res = await fetch(`/api/native-token/${chainId}`);

        if (res.ok) {
          const data = await res.json();
          const nativeToken: MappedTokenContract = {
            address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // NATIVE_TOKEN_ADDRESS
            amount: 0n,
            balance: 0n,
            chainId,
            decimals: data.decimals,
            name: data.name,
            symbol: data.symbol,
            totalSupply: 0n,
          };

          debugLog.log('✅ Native token fetched successfully:', nativeToken);
          setToken(nativeToken);
        } else {
          debugLog.log(`❌ Failed to fetch native token: HTTP ${res.status}`);
        }
      } catch (err) {
        debugLog.log(`🛑 Exception during fetch for chainId ${chainId}:`, err);
        console.error(`Failed to fetch native token for chainId ${chainId}:`, err);
      }
    };

    fetchToken();
  }, [chainId]);

  return token;
}
