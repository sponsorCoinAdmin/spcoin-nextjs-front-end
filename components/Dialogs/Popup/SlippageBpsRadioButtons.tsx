import React, { useEffect, useState } from 'react';
import { type RadioChangeEvent, Radio } from "antd";
import { useSlippageBps } from '@/lib/context/contextHooks';

function SlippageBpsRadioButtons() {
  const [slippageBps, setSlippageBps] = useSlippageBps();
  const [value, setValue] = useState("");

  useEffect(() => {
    const newValue = (slippageBps / 100).toString();
    setValue(newValue);
  }, [slippageBps]);

  const setRadioButton = ({ target: { value } }: RadioChangeEvent) => {
    const bps = Math.round(parseFloat(value) * 100);
    setValue(value);
    if (bps !== slippageBps) {
      console.log('📦 setSlippageBps called with', bps);
      setSlippageBps(bps);
    }
  };

  const options = [
    { label: '0.5%', value: "0.005" },
    { label: '1%', value: "0.01" },
    { label: '2%', value: "0.02" },
    { label: '3%', value: "0.03" },
    { label: '4%', value: "0.04" },
    { label: '5%', value: "0.05" },
  ];

  return (
    <div>
      <div>Slippage Bps Tolerance</div>
      <Radio.Group
        value={value}
        onChange={setRadioButton}
        optionType="button"
        buttonStyle="solid"
      >
        {options.map(opt => (
          <Radio.Button key={opt.value} value={opt.value}>
            {opt.label}
          </Radio.Button>
        ))}
      </Radio.Group>
    </div>
  );
}

export default SlippageBpsRadioButtons;
