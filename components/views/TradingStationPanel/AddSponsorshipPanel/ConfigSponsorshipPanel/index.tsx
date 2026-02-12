// File: @/components/views\TradingStationPanel/AddSponsorshipPanel/ConfigSponsorshipPanel/index.tsx
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import info_png from '@/public/assets/miscellaneous/info1.png';

import { SP_COIN_DISPLAY } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';

const MIN_SPONSOR_STEP = 2; // 20% recipient / 80% sponsor
const MAX_SPONSOR_STEP = 10; // 100% recipient / 0% sponsor

const MIN_AGENT_STEP = 2; // 2% of remaining balance
const MAX_AGENT_STEP = 10; // 10% of remaining balance

const ConfigSlippagePanel: React.FC = () => {
  const { isVisible, closePanel } = usePanelTree();

  // ✅ Always evaluate visibility, but DO NOT early-return until after hooks
  const selfVisible = isVisible(SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL);

  // Sponsor slider: step from 2..10 where
  //   sponsorPct = 100 - step * 10
  //   remainingBal (RB) = step * 10
  const [sponsorStep, setSponsorStep] = useState<number>(5); // RB=50, SP=50 by default

  // Agent slider: step from 2..10 representing 2%..10% of remainingBal
  //   sliderRatioRange (SRR) = agentStep / 100
  //   agentPct (AP) = RB * SRR
  //   recipientPct (RP) = RB - AP
  const [agentStep, setAgentStep] = useState<number>(2); // 2% of RB by default

  // --- core percentage math -------------------------------------------------

  const sponsorPct = useMemo(() => 100 - sponsorStep * 10, [sponsorStep]); // SP
  const remainingBal = useMemo(() => sponsorStep * 10, [sponsorStep]); // RB

  const sliderRatioRange = useMemo(() => agentStep / 100, [agentStep]); // SRR

  const agentPct = useMemo(() => {
    const raw = remainingBal * sliderRatioRange; // AP = RB * SRR
    return Number(raw.toFixed(2));
  }, [remainingBal, sliderRatioRange]);

  const recipientPct = useMemo(() => {
    const raw = remainingBal - agentPct; // RP = RB - AP
    return Number(raw.toFixed(2));
  }, [remainingBal, agentPct]);

  const onClose = useCallback(() => {
    closePanel(
      SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL,
      'ConfigSlippagePanel:close(CONFIG_SPONSORSHIP_PANEL)',
    );
  }, [closePanel]);

  // ✅ Option A: conditional JSX return AFTER hooks
  if (!selfVisible) return null;

  return (
    <div
      id="CONFIG_SPONSORSHIP_PANEL"
      className="bg-[#1f2639] text-[#94a3b8] border-0 h-[90px] rounded-b-[12px]"
    >
      <div className="relative">
        <div id="recipient-config" />

        {/* top divider line */}
        <div className="absolute -top-[7px] left-[11px] right-[11px] h-px bg-[#94a3b8] opacity-20" />

        {/* label: Staking Reward Ratio */}
        <div className="absolute top-[5px] left-[10px] text-[14px] text-[#94a3b8]">
          Staking Reward Distributions:
        </div>

        {/* info icon */}
        <Image
          src={info_png}
          className="absolute top-[5px] left-[218px] cursor-pointer"
          width={18}
          height={18}
          alt="Info"
          onClick={() => alert('ToDo: Rate Distribution Info')}
        />

        {/* Overall Recipient pill (final RP after Agent deduction) */}
        <div className="absolute top-0 right-[50px] min-w-[50px] h-[28px] bg-[#243056] rounded-full flex justify-start items-center gap-[5px] font-bold text-[17px] pr-2">
          Sponsor:
          <div id="sponsorRatio">{sponsorPct}%</div>
        </div>

        {/* close button */}
        <div
          id="closeSponsorConfig"
          className="absolute top-0 right-[15px] text-[#94a3b8] text-[20px] cursor-pointer"
          onClick={onClose}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onClose();
            }
          }}
          aria-label="Close sponsorship config"
        >
          X
        </div>

        {/* Row 1: Sponsor + slider */}
        <div className="absolute top-[36px] right-[50px] min-w-[50px] h-[14px] bg-[#243056] rounded-full flex justify-start items-center gap-[5px] font-bold text-[17px] pr-2">
         Recipient:
          <div id="recipientRatio">{recipientPct}%</div>
        </div>

        <input
          type="range"
          title="Adjust Sponsor/Recipient Ratio"
          className="absolute top-[63px] left-[11px] -mt-[20.5px] border-0 h-[1px] w-[224px] rounded-none outline-none bg-white cursor-pointer"
          min={MIN_SPONSOR_STEP}
          max={MAX_SPONSOR_STEP}
          value={sponsorStep}
          onChange={(e) => setSponsorStep(Number(e.target.value))}
        />

        {/* Row 2: Agent + slider (takes a slice of remainingBal) */}
        <div className="absolute top-[60px] right-[50px] min-w-[50px] h-[24px] bg-[#243056] rounded-full flex justify-start items-center gap-[5px] font-bold text-[17px] pr-2">
          Agent:
          <div id="agentRatio">{agentPct}%</div>
        </div>

        <input
          type="range"
          title="Adjust Recipient/Agent Ratio"
          className="absolute top-[93px] left-[11px] -mt-[20.5px] border-0 h-[1px] w-[224px] rounded-none outline-none bg-white cursor-pointer"
          min={MIN_AGENT_STEP}
          max={MAX_AGENT_STEP}
          value={agentStep}
          onChange={(e) => setAgentStep(Number(e.target.value))}
        />
      </div>
    </div>
  );
};

export default ConfigSlippagePanel;
