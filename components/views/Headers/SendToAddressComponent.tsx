// File: components/views/Headers/SendToAddressComponent.tsx
'use client';

import { SP_COIN_DISPLAY } from '@/lib/structure';
import PanelGate from '@/components/utility/PanelGate';

type Props = {
  value: string;
  onChange: (v: string) => void;
};

export default function SendToAddressComponent({ value, onChange }: Props) {
  return (
    <PanelGate panel={SP_COIN_DISPLAY.SEND_TO_ADDRESS}>
      <div className="shrink-0 border-b border-slate-700/50 -mx-4 px-4 py-2 flex items-center gap-3 text-sm">
        <span className="text-[#8FA8FF] font-semibold whitespace-nowrap">To Address</span>
        <input
          className="flex-1 min-w-0 rounded-[22px] bg-[#243056] px-3 py-1 text-[15px] text-[#5981F3] font-mono placeholder:text-slate-500 focus:outline-none border-0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="transfer(to)"
          autoComplete="off"
          spellCheck={false}
        />
      </div>
    </PanelGate>
  );
}
