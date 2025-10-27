// File: app/(menu)/Exchange/DevTools/page.tsx

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import ReadWagmiERC20Fields from '@/components/ERC20/ReadWagmiERC20Fields';
import ReadWagmiERC20RecordFields from '@/components/ERC20/ReadWagmiERC20RecordFields';
import ProviderConfigurationStatus from '@/components/ERC20/ProviderConfigurationStatus';
import ReadWagmiERC20Records from '@/components/ERC20/ReadWagmiERC20Records';
import ReadWagmiERC20ContractFields from '@/components/ERC20/ReadWagmiERC20ContractFields';
import ReadWagmiERC20BalanceOf from '@/components/ERC20/ReadWagmiERC20BalanceOf';
import ReadWagmiERC20ContractName from '@/components/ERC20/ReadWagmiERC20ContractName';
import ReadWagmiERC20ContractSymbol from '@/components/ERC20/ReadWagmiERC20ContractSymbol';
import ReadWagmiERC20ContractDecimals from '@/components/ERC20/ReadWagmiERC20ContractDecimals';
import ReadWagmiERC20ContractTotalSupply from '@/components/ERC20/ReadWagmiERC20ContractTotalSupply';
import { BURN_ADDRESS, NATIVE_TOKEN_ADDRESS } from '@/lib/structure';
import type { Address } from 'viem';

const USDT_TON_CONTRACT: Address = '0x582d872A1B094FC48F5DE31D3B73F2D9bE47def1';
const USDT_POLYGON_CONTRACT: Address = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';
const CHKN_ETHEREUM_CONTRACT: Address = USDT_TON_CONTRACT;

function App() {
  const { chainId } = useAccount();

  const initialAddress = useMemo<Address>(() => {
    // Safe initial value before we know the chain
    return BURN_ADDRESS;
  }, []);

  const [TOKEN_CONTRACT_ADDRESS, setTokenContractAddress] =
    useState<Address>(initialAddress);

  // Pick a token address based on the connected chain
  useEffect(() => {
    switch (chainId) {
      case 1: // Ethereum
        setTokenContractAddress(CHKN_ETHEREUM_CONTRACT);
        break;
      case 137: // Polygon
        setTokenContractAddress(USDT_POLYGON_CONTRACT);
        break;
      default:
        setTokenContractAddress(NATIVE_TOKEN_ADDRESS);
        break;
    }
  }, [chainId]);

  return (
    <>
      <ProviderConfigurationStatus />
      <ReadWagmiERC20Fields TOKEN_CONTRACT_ADDRESS={TOKEN_CONTRACT_ADDRESS} />
      <ReadWagmiERC20RecordFields TOKEN_CONTRACT_ADDRESS={TOKEN_CONTRACT_ADDRESS} />
      <ReadWagmiERC20Records TOKEN_CONTRACT_ADDRESS={TOKEN_CONTRACT_ADDRESS} />
      <ReadWagmiERC20ContractFields TOKEN_CONTRACT_ADDRESS={TOKEN_CONTRACT_ADDRESS} />
      <ReadWagmiERC20BalanceOf TOKEN_CONTRACT_ADDRESS={TOKEN_CONTRACT_ADDRESS} />
      <ReadWagmiERC20ContractName TOKEN_CONTRACT_ADDRESS={TOKEN_CONTRACT_ADDRESS} />
      <ReadWagmiERC20ContractSymbol TOKEN_CONTRACT_ADDRESS={TOKEN_CONTRACT_ADDRESS} />
      <ReadWagmiERC20ContractDecimals TOKEN_CONTRACT_ADDRESS={TOKEN_CONTRACT_ADDRESS} />
      <ReadWagmiERC20ContractTotalSupply TOKEN_CONTRACT_ADDRESS={TOKEN_CONTRACT_ADDRESS} />
    </>
  );
}

export default App;
