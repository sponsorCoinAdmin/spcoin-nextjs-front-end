// File: app/(menu)/Exchange/Test/page.tsx

'use client';

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { JSONTree } from 'react-json-tree';

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

// Utilities & Context
import { useExchangeContext } from '@/lib/context/contextHooks';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { usePageState } from '@/lib/context/PageStateContext';

function App() {
  const { address } = useAccount();
  const { exchangeContext } = useExchangeContext();
  const { state, setState } = usePageState();

  const {
    showContext = false,
    showWallets = false,
    collapsedKeys = [],
  } = state.test.exchangePage;

  useEffect(() => {
    if (address) {
      setState(prev => ({
        ...prev,
        test: {
          ...prev.test,
          exchangePage: {
            ...prev.test.exchangePage,
            // Not persisted in state; used only locally
          },
        },
      }));
    }
  }, [address]);

  const updateExchangePage = (updates: Partial<typeof state.test.exchangePage>) => {
    setState(prev => ({
      ...prev,
      test: {
        ...prev.test,
        exchangePage: {
          ...prev.test.exchangePage,
          ...updates,
        },
      },
    }));
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

  const resetCollapsedKeys = () => {
    updateExchangePage({ collapsedKeys: [] });
  };

  const logContext = () => {
    console.log('📦 Log Context:', stringifyBigInt(exchangeContext));
  };

  const shouldExpandNode = (keyPath: (string | number)[], data: unknown, level: number) => {
    const key = keyPath.slice().reverse().join('.');
    return !collapsedKeys.includes(key);
  };

  const theme = {
    base00: '#243056', base01: '#2a3350', base02: '#37415c', base03: '#5c6b88',
    base04: '#a2b4d3', base05: '#ffffff', base06: '#ffffff', base07: '#ffffff',
    base08: '#f2777a', base09: '#f99157', base0A: '#ffcc66', base0B: '#99cc99',
    base0C: '#66cccc', base0D: '#6699cc', base0E: '#cc99cc', base0F: '#d27b53',
  };

  return (
    <div className="space-y-6 p-6">
      {/* Control Buttons */}
      <div className="flex flex-wrap gap-4">
        <button onClick={toggleContext} className="px-4 py-2 text-sm font-medium text-[#5981F3] bg-[#243056] rounded hover:text-green-500">
          {showContext ? 'Hide Context' : 'Show Context'}
        </button>
        {showContext && (
          <button onClick={resetCollapsedKeys} className="px-4 py-2 text-sm font-medium text-[#5981F3] bg-[#243056] rounded hover:text-green-500">
            Reset Collapsed State
          </button>
        )}
        <button onClick={toggleWallets} className="px-4 py-2 text-sm font-medium text-[#5981F3] bg-[#243056] rounded hover:text-green-500">
          {showWallets ? 'Hide Test Wallets' : 'Show Test Wallets'}
        </button>
        <button onClick={logContext} className="px-4 py-2 text-sm font-medium text-[#5981F3] bg-[#243056] rounded hover:text-green-500">
          Log Context
        </button>
      </div>

      {/* Context Display */}
      {showContext && (
        <div className="flex-grow bg-[#243056] text-white p-4 rounded-lg w-full min-h-0" style={{ fontSize: '15px' }}>
          <JSONTree
            data={exchangeContext}
            theme={theme}
            invertTheme={false}
            shouldExpandNode={shouldExpandNode}
          />
        </div>
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

export default App;
