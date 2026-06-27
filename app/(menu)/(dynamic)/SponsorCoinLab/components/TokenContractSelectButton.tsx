'use client';

import { SelectChevron } from './SelectChevron';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { SP_COIN_DISPLAY } from '@/lib/structure';

type Props = {
  className?: string;
  contractAddress?: string;
  contractName?: string;
  contractSymbol?: string;
};

export default function TokenContractSelectButton({ className, contractAddress, contractName, contractSymbol }: Props) {
  const { openPanel } = usePanelTree();

  const openTokenList = () => {
    openPanel(SP_COIN_DISPLAY.TOKEN_LIST_SELECT_PANEL, 'TokenContractSelectButton', SP_COIN_DISPLAY.SEND_CONTRACT);
  };

  const namePart = [contractName, contractSymbol].filter(Boolean).join(' / ');
  const addrPart = contractAddress
    ? `${contractAddress.slice(0, 8)}...${contractAddress.slice(-6)}`
    : '';
  const label = contractAddress
    ? namePart ? `${namePart}  ${addrPart}` : contractAddress
    : 'Select Token Contract';

  return (
    <div className="relative w-full min-w-0">
      <button
        type="button"
        onClick={openTokenList}
        className={`${className ?? ''} flex items-center justify-between gap-3 pr-3 text-left`}
      >
        <span className={contractAddress ? 'min-w-0 truncate text-white' : 'min-w-0 truncate text-[#9CA3AF]'}>
          {label}
        </span>
        <span className="inline-flex shrink-0 items-center justify-center text-[#8FA8FF] transition-colors">
          <SelectChevron open={false} />
        </span>
      </button>
    </div>
  );
}
