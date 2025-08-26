// File: components/views/Config/SlippageBpsRadioButtons.tsx
'use client';

import React, { memo, useCallback } from 'react';
import { useSlippage } from '@/lib/context/hooks';

const OPTIONS = [
  { label: '0.5%', value: 50 },
  { label: '1%',   value: 100 },
  { label: '2%',   value: 200 },
  { label: '3%',   value: 300 },
  { label: '4%',   value: 400 },
  { label: '5%',   value: 500 },
];

function SlippageBpsRadioButtonsInner() {
  const { data: slippage, setBps } = useSlippage();
  const selected = slippage?.bps ?? 100;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = Number(e.target.value);
      if (!Number.isFinite(next)) return;
      if (next !== selected) setBps(next);
    },
    [selected, setBps]
  );

  return (
    <div className="inline-block m-2 p-2 border rounded bg-gray-50">
      <div className="font-semibold mb-2">Slippage Tolerance</div>

      <div role="radiogroup" aria-label="Slippage Tolerance" className="flex flex-wrap gap-2">
        {OPTIONS.map((opt) => {
          const isActive = selected === opt.value;
          return (
            <label
              key={opt.value}
              className={`px-3 py-1 border rounded cursor-pointer transition text-sm ${
                isActive ? 'bg-blue-500 text-white' : 'bg-white text-black'
              }`}
            >
              <input
                type="radio"
                name="slippage"
                value={opt.value}
                checked={isActive}
                onChange={handleChange}
                className="hidden"
              />
              {opt.label}
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default memo(SlippageBpsRadioButtonsInner);
