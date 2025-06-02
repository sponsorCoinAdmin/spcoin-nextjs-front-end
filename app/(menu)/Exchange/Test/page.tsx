// File: app/(menu)/Exchange/Test/page.tsx

'use client';

import { useEffect } from 'react';
import { useAccount } from 'wagmi';

// Components
import ReadWagmiERC20Fields from '@/components/ERC20/ReadWagmiERC20Fields';
import ReadWagmiERC20RecordFields from '@/components/ERC20/ReadWagmiERC20RecordFields';
import ReadWagmiERC20Records from '@/components/ERC20/ReadWagmiERC20Records';
import ReadWagmiERC20ContractFields from '@/components/ERC20/ReadWagmiERC20ContractFields';
import ReadWagmiERC20BalanceOf from '@/components/ERC20/ReadWagmiERC20BalanceOf';
import ReadWagmiERC20ContractName from '@/components/ERC20/ReadWagmiERC20ContractName';
import ReadWagmiERC20ContractSymbol from '@/components/ERC20/ReadWagmiERC20ContractSymbol';
import ReadWagmiERC20ContractDecimals from '@/components/ERC20/ReadWagmiERC20ContractDecimals';
import ReadWagmiERC20ContractTotalSupply from '@/components/ERC20/ReadWagmiERC20ContractTotalSupply';
import WalletsPage from '@/components/Pages/WalletsPage';
import JsonInspector from '@/components/shared/JsonInspector';

// Utilities & Context
import { useExchangeContext } from '@/lib/context/hooks/contextHooks';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { usePageState } from '@/lib/context/PageStateContext';



function TestPage() {
  const { address } = useAccount();
  const { exchangeContext } = useExchangeContext();
  const { state, setState } = usePageState();

  const {
    showContext = false,
    showWallets = false,
    collapsedKeys = [],
    expandContext = false,
  } = state.page.exchangePage;

  useEffect(() => {
  localStorage.setItem('PageStateContext', JSON.stringify(state));
}, [state]);

  useEffect(() => {
    if (address) {
      setState(prev => ({
        ...prev,
        page: {
          ...prev.page,
          exchangePage: {
            ...prev.page.exchangePage,
          },
        },
      }));
    }
  }, [address]);

  const updateExchangePage = (updates: Partial<typeof state.page.exchangePage>) => {
    setState(prev => {
      const newState = {
        ...prev,
        page: {
          ...prev.page,
          exchangePage: {
            ...prev.page.exchangePage,
            ...updates,
          },
        },
      };
      localStorage.setItem('PageStateContext', JSON.stringify(newState));
      return newState;
    });
  };

  const toggleContext = () => {
    if (!showContext) updateExchangePage({ showWallets: false });
    updateExchangePage({ showContext: !showContext });
  };

  const toggleWallets = () => {
    updateExchangePage({
      showWallets: !showWallets,
      showContext: showWallets ? showContext : false,
    });
  };

  const toggleExpandCollapse = () => {
    const nextExpand = !expandContext;
    const nextKeys = nextExpand ? [] : getAllKeys(exchangeContext, 'root');
    updateExchangePage({
      expandContext: nextExpand,
      collapsedKeys: nextKeys,
    });
  };

  const getAllKeys = (obj: any, basePath: string): string[] => {
    let keys: string[] = [basePath];
    if (typeof obj === 'object' && obj !== null) {
      Object.entries(obj).forEach(([k, v]) => {
        const childPath = `${basePath}.${k}`;
        keys.push(...getAllKeys(v, childPath));
      });
    }
    return keys;
  };

  const logContext = () => {
    console.log('📦 Log Context:', stringifyBigInt(exchangeContext));
  };

  return (
    <div className="space-y-6 p-6">
      {/* Control Buttons */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={toggleContext}
          className="px-4 py-2 text-sm font-medium text-[#5981F3] bg-[#243056] rounded hover:text-green-500"
        >
          {showContext ? 'Hide Context' : 'Show Context'}
        </button>

        {showContext && (
          <button
            onClick={toggleExpandCollapse}
            className="px-4 py-2 text-sm font-medium text-[#5981F3] bg-[#243056] rounded hover:text-green-500"
          >
            {expandContext ? 'Collapse Context' : 'Expand Context'}
          </button>
        )}

        <button
          onClick={logContext}
          className="px-4 py-2 text-sm font-medium text-[#5981F3] bg-[#243056] rounded hover:text-green-500"
        >
          Log Context
        </button>

        <button
          onClick={toggleWallets}
          className="px-4 py-2 text-sm font-medium text-[#5981F3] bg-[#243056] rounded hover:text-green-500"
        >
          {showWallets ? 'Hide Test Wallets' : 'Show Test Wallets'}
        </button>
      </div>

      {/* Context Display */}
      {showContext && (
        <JsonInspector
          data={exchangeContext}
          collapsedKeys={collapsedKeys}
          updateCollapsedKeys={(next: string[]) => updateExchangePage({ collapsedKeys: next })}
        />
      )}

      {/* Wallets Page Display */}
      {showWallets && (
        <div className="w-screen bg-[#1f2639] border border-gray-700 rounded-none shadow-inner p-4 m-0">
          <WalletsPage />
        </div>
      )}

      {/* ERC20 Read Operations */}
      <div className="grid gap-6">
        <ReadWagmiERC20Fields TOKEN_CONTRACT_ADDRESS={undefined} />
        <ReadWagmiERC20RecordFields TOKEN_CONTRACT_ADDRESS={undefined} />
        <ReadWagmiERC20Records TOKEN_CONTRACT_ADDRESS={undefined} />
        <ReadWagmiERC20ContractFields TOKEN_CONTRACT_ADDRESS={undefined} />
        <ReadWagmiERC20BalanceOf ACTIVE_ACCOUNT_ADDRESS={address} TOKEN_CONTRACT_ADDRESS={undefined} />
        <ReadWagmiERC20ContractName TOKEN_CONTRACT_ADDRESS={undefined} />
        <ReadWagmiERC20ContractSymbol TOKEN_CONTRACT_ADDRESS={undefined} />
        <ReadWagmiERC20ContractDecimals TOKEN_CONTRACT_ADDRESS={undefined} />
        <ReadWagmiERC20ContractTotalSupply TOKEN_CONTRACT_ADDRESS={undefined} />
      </div>
    </div>
  );
}

export default TestPage;
