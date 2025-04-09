import React, { useEffect, useState } from 'react';
import { useSlippageBps } from '@/lib/context/contextHooks';

function SlippageBpsRadioButtons() {
  const [slippageBps, setSlippageBps] = useSlippageBps();
  const [value, setValue] = useState('');

  useEffect(() => {
    const newValue = (slippageBps).toString();
    setValue(newValue);
  }, [slippageBps]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    const bps = Math.round(parseFloat(newValue));
    setValue(newValue);
    if (bps !== slippageBps) {
      console.log('📦 setSlippageBps called with', bps);
      setSlippageBps(bps);
    }
  };

  const options = [
    { label: '0.5%', value: '50' },
    { label: '1%', value: '100' },
    { label: '2%', value: '200' },
    { label: '3%', value: '300' },
    { label: '4%', value: '400' },
    { label: '5%', value: '500' },
  ];

  return (
    <div className="inline-block m-2 p-2 border rounded bg-gray-50">
      <div className="font-semibold mb-2">Slippage Tolerance</div>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <label
            key={opt.value}
            className={`px-3 py-1 border rounded cursor-pointer transition text-sm ${
              value === opt.value
                ? 'bg-blue-500 text-white'
                : 'bg-white text-black'
            }`}
          >
            <input
              type="radio"
              name="slippage"
              value={opt.value}
              checked={value === opt.value}
              onChange={handleChange}
              className="hidden"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  );
}

export default SlippageBpsRadioButtons;
