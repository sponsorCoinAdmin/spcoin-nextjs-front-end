// File: components/Headers/TradeContainerHeader.tsx
'use client';

import Image from 'next/image';
import cog_png from '@/public/assets/miscellaneous/cog.png';
import ConfigPanel from '@/components/views/Config/ConfigPanel';
import { exchangeContextDump } from '@/lib/spCoin/guiUtils';
import { useExchangeContext } from '@/lib/context/hooks';
import ConnectNetworkButton from '@/components/Buttons/Connect/ConnectNetworkButton';
import { useHeaderController } from '@/lib/context/exchangeContext/hooks/useHeaderController';
import CloseButton from '@/components/Buttons/CloseButton';

export default function TradeContainerHeader() {
  const { exchangeContext } = useExchangeContext();
  const {
    title,
    leftElement,
    isConfigOpen,
    onOpenConfig,
    onCloseConfig,
    onClose,
    isTrading,
  } = useHeaderController();

  return (
    <div
      id='TradeContainerHeader'
      className='grid grid-cols-[auto_1fr_auto] items-center w-full box-border h-[50px] min-h-[50px] py-0 px-0 shrink-0 my-[3px]'
    >
      <ConfigPanel showPanel={isConfigOpen} onClose={onCloseConfig as any} />

      <div
        id='SponsorCoinLogo.png'
        onDoubleClick={() => exchangeContextDump(exchangeContext)}
        className='flex items-center my-0 pl-0 ml-0'
      >
        {leftElement ?? (
          <ConnectNetworkButton
            showName={false}
            showSymbol={false}
            showChevron={false}
            showConnect={false}
            showDisconnect={false}
            showHoverBg={false}
          />
        )}
      </div>

      <h4 className='justify-self-center m-0 leading-none text-base font-semibold select-none text-center'>
        {title}
      </h4>

      <div className='flex items-center justify-end my-0'>
        {isTrading ? (
          <Image
            src={cog_png}
            alt='Open settings'
            title='Open settings'
            onClick={onOpenConfig}
            className='h-5 w-5 object-contain cursor-pointer transition duration-300 hover:rotate-[360deg]'
            priority
          />
        ) : (
          <CloseButton
            closeCallback={onClose}
            className='
              absolute top-2 right-[27px] h-10 w-10 rounded-full
              bg-[#243056] text-[#5981F3] flex items-center justify-center
              leading-none transition-colors text-3xl
              hover:bg-[#5981F3] hover:text-[#243056]
            '
          />
        )}
      </div>
    </div>
  );
}
