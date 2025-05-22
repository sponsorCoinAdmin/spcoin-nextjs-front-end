'use client';

import React, { useEffect, useState } from 'react';
import { Address } from 'viem';
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

// Utilities & Context
import { useExchangeContext } from '@/lib/context/contextHooks';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { TokenContract } from '@/lib/structure/types';

function App() {
  const { address } = useAccount();
  const { exchangeContext } = useExchangeContext();

  const [activeAccountAddress, setActiveAccountAddress] = useState<Address | undefined>(address);
  const [exchangeContextData, setExchangeContextData] = useState<string>('');
  const [textInputField, setTokenInput] = useState<Address | undefined>();
  const [contextVisible, setContextVisible] = useState(false);
  const [showWallets, setShowWallets] = useState(false);

  useEffect(() => {
    if (address && activeAccountAddress !== address) {
      setActiveAccountAddress(address);
    }
  }, [address]);

  const toggleContext = () => {
    if (!contextVisible) {
      setExchangeContextData(stringifyBigInt(exchangeContext));
      setShowWallets(false); // ⬅️ Hide wallets when showing context
    } else {
      setExchangeContextData('');
    }
    setContextVisible((prev) => !prev);
  };

  const toggleWallets = () => {
    setShowWallets((prev) => {
      const newValue = !prev;
      if (newValue) {
        setContextVisible(false); // ⬅️ Hide context when showing wallets
        setExchangeContextData('');
      }
      return newValue;
    });
  };

  const setTokenContractCallBack = (tokenContract: TokenContract | undefined) => {
    setTokenInput(tokenContract?.address);
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
          type="button"
          className="px-4 py-2 text-sm font-medium text-[#5981F3] bg-[#243056] rounded hover:text-green-500"
        >
          {contextVisible ? 'Hide Context' : 'Show Context'}
        </button>

        <button
          onClick={toggleWallets}
          className="px-4 py-2 text-sm font-medium text-[#5981F3] bg-[#243056] rounded hover:text-green-500"
        >
          {showWallets ? 'Hide Test Wallets' : 'Show Test Wallets'}
        </button>

        <button
          onClick={logContext}
          type="button"
          className="px-4 py-2 text-sm font-medium text-[#5981F3] bg-[#243056] rounded hover:text-green-500"
        >
          Log Context
        </button>
      </div>

      {/* Context Display */}
      {contextVisible && exchangeContextData && (
        <div className="mt-4 bg-[#243056] text-white text-xs p-4 rounded-lg h-[400px] w-[550px] overflow-y-auto whitespace-pre-wrap break-words border border-gray-700 shadow-inner">
          {exchangeContextData}
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
        <ReadWagmiERC20Fields TOKEN_CONTRACT_ADDRESS={textInputField} />
        <ReadWagmiERC20RecordFields TOKEN_CONTRACT_ADDRESS={textInputField} />
        <ReadWagmiERC20Records TOKEN_CONTRACT_ADDRESS={textInputField} />
        <ReadWagmiERC20ContractFields TOKEN_CONTRACT_ADDRESS={textInputField} />
        <ReadWagmiERC20BalanceOf
          ACTIVE_ACCOUNT_ADDRESS={activeAccountAddress}
          TOKEN_CONTRACT_ADDRESS={textInputField}
        />
        <ReadWagmiERC20ContractName TOKEN_CONTRACT_ADDRESS={textInputField} />
        <ReadWagmiERC20ContractSymbol TOKEN_CONTRACT_ADDRESS={textInputField} />
        <ReadWagmiERC20ContractDecimals TOKEN_CONTRACT_ADDRESS={textInputField} />
        <ReadWagmiERC20ContractTotalSupply TOKEN_CONTRACT_ADDRESS={textInputField} />
      </div>
    </div>
  );
}

export default App;
