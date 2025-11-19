// File: components/containers/ConfigSponsorshipPanel.tsx
'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import info_png from '@/public/assets/miscellaneous/info1.png';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { usePanelTransitions } from '@/lib/context/exchangeContext/hooks/usePanelTransitions';

const MIN_STEP = 2; // matches prior code
const MAX_STEP = 10;

const ConfigSponsorshipPanel: React.FC = () => {
  const { isVisible } = usePanelTree();
  const { closeConfigSponsorship } = usePanelTransitions();

  // "step" from 2..10 where displayed percentages are step*10 and (100 - step*10)
  const [step, setStep] = useState<number>(5);

  const recipientPct = useMemo(() => step * 10, [step]);
  const sponsorPct = useMemo(() => 100 - step * 10, [step]);
  const agentPct = useMemo(() => 100 - step * 10, [step]);

  const selfVisible = isVisible(SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL);
  if (!selfVisible) return null;

  return (
    <div
      id='SponsorRateConfig_ID'
      className='bg-[#1f2639] text-[#94a3b8] border-0 h-[90px] rounded-b-[12px]'
    >
      <div className='relative'>
        <div id='recipient-config' />

        {/* top divider line */}
        <div className='absolute -top-[7px] left-[11px] right-[11px] h-px bg-[#94a3b8] opacity-20' />

        {/* label: Staking Reward Ratio */}
        <div className='absolute top-[5px] left-[10px] text-[14px] text-[#94a3b8]'>
          Staking Reward Distributions:
        </div>

        {/* info icon */}
        <Image
          src={info_png}
          className='absolute top-[5px] left-[218px] cursor-pointer'
          width={18}
          height={18}
          alt='Info'
          onClick={() => alert('ToDo: Rate Sistribution Info')}
        />

        {/* Sponsor ratio pill */}
        <div className='absolute top-0 right-[50px] min-w-[50px] h-[28px] bg-[#243056] rounded-full flex justify-start items-center gap-[5px] font-bold text-[17px] pr-2'>
          Recipient:
          <div id='sponsorRatio'>{recipientPct}%</div>
        </div>

        {/* close button */}
        <div
          id='closeSponsorConfig'
          className='absolute top-0 right-[15px] text-[#94a3b8] text-[20px] cursor-pointer'
          onClick={closeConfigSponsorship}
        >
          X
        </div>

        {/* Row 1: AARecipient + slider */}
        <div className='absolute top-[35px] right-[50px] min-w-[50px] h-[14px] bg-[#243056] rounded-full flex justify-start items-center gap-[5px] font-bold text-[17px] pr-2'>
          Sponsor:
          <div id='recipientRatio'>{sponsorPct}%</div>
        </div>

        <input
          type='range'
          title='Adjust Sponsor/Recipient Ratio'
          className='absolute top-[62px] left-[11px] -mt-[20.5px] border-0 h-[1px] w-[200px] rounded-none outline-none bg-white cursor-pointer'
          min={MIN_STEP}
          max={MAX_STEP}
          value={step}
          onChange={(e) => setStep(Number(e.target.value))}
        />

        <div className='absolute top-[60px] right-[50px] min-w-[50px] h-[24px] bg-[#243056] rounded-full flex justify-start items-center gap-[5px] font-bold text-[17px] pr-2'>
          Agent:
          <div id='recipientRatio'>{agentPct}%</div>
        </div>

        <input
          type='range'
          title='Adjust Recipient/Agent Ratio'
          className='absolute top-[90px] left-[11px] -mt-[20.5px] border-0 h-[1px] w-[200px] rounded-none outline-none bg-white cursor-pointer'
          min={MIN_STEP}
          max={MAX_STEP}
          value={step}
          onChange={(e) => setStep(Number(e.target.value))}
        />
      </div>
    </div>
  );
};

export default ConfigSponsorshipPanel;
