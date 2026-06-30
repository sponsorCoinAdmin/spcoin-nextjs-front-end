'use client';

import { useCallback } from 'react';
import { ChevronDown } from 'lucide-react';

import { SP_COIN_DISPLAY } from '@/lib/structure';
import { useExchangeContext } from '@/lib/context/hooks';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { defaultMissingImage } from '@/lib/context/helpers/assetHelpers';
import AccountAvatar from '@/components/utility/AccountAvatar';
import { truncateMiddle } from '@/lib/utils/addressUtils';

export default function SendRecipientPanel() {
  const { exchangeContext } = useExchangeContext();
  const { openPanel, closePanel } = usePanelTree();
  const recipientPickerVisible = usePanelVisible(SP_COIN_DISPLAY.SEND_RECIPIENT_SELECT_PANEL);

  const toAddress = (exchangeContext.accounts?.sendRecipientAddress ?? '') as string;
  const recipientLogoURL = (exchangeContext.accounts?.sendRecipientLogoURL as string | undefined) ?? defaultMissingImage;

  const handleChevronClick = useCallback(() => {
    if (recipientPickerVisible) {
      closePanel(SP_COIN_DISPLAY.SEND_RECIPIENT_SELECT_PANEL, 'SendRecipientPanel:chevron:close');
    } else {
      openPanel(SP_COIN_DISPLAY.SEND_RECIPIENT_SELECT_PANEL, 'SendRecipientPanel:chevron:open');
    }
  }, [recipientPickerVisible, openPanel, closePanel]);

  return (
    <div id="SEND_RECIPIENT_PANEL" className="relative h-[60px]">
      <div title="To Recipient" className="absolute top-5 left-[10px] text-[#94a3b8] text-[14px]">
        To Recipient:
      </div>
      <div className="absolute flex items-center gap-[5px]" style={{ top: '12px', right: '20px' }}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md hover:opacity-80 transition-opacity">
          <AccountAvatar
            logoURL={toAddress ? recipientLogoURL : undefined}
            address={toAddress || undefined}
            className="h-full w-full object-contain"
          />
        </div>
        <div
          className="flex h-[25px] items-center gap-[5px] rounded-full bg-[#243056] px-3 text-white font-bold"
          title={toAddress || ''}
        >
          <span className="whitespace-nowrap font-mono cursor-default select-all text-[17px]">
            {toAddress
              ? truncateMiddle(toAddress, 4, 4)
              : <span className="text-slate-400 italic font-normal text-[17px]">Select recipient…</span>
            }
          </span>
          <button
            type="button"
            onClick={handleChevronClick}
            className="shrink-0 flex items-center justify-center rounded hover:bg-white/10 p-0.5"
            aria-label={recipientPickerVisible ? 'Close recipient picker' : 'Open recipient picker'}
          >
            <ChevronDown className={[
              'h-4 w-4 text-slate-400 transition-transform duration-200',
              recipientPickerVisible ? 'rotate-180' : '',
            ].join(' ')} />
          </button>
        </div>
      </div>
    </div>
  );
}
