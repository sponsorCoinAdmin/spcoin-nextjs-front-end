import React, { useEffect, useState } from 'react';
import { type RadioChangeEvent, Radio } from "antd";
import { useSlippageBps } from '@/lib/context/contextHooks';

function SlippageBps() {
  // ✅ Call the hook at the top level
  const [slippageBps, setSlippageBps] = useSlippageBps();
  const [value, setValue] = useState("0.02");

  useEffect(() => {
    setValue(slippageBps.toString());
  }, [slippageBps]); // ✅ Ensure the effect runs when slippageBps changes

  const setRadioButton = ({ target: { value } }: RadioChangeEvent) => {
    console.log('radio checked ' + value);
    setValue(value);
    setSlippageBps(parseFloat(value)); // ✅ Convert value to float before setting
  };

  const options = [
    { label: '0.5%', value: 0.005 },
    { label: '1%', value: 0.01 },
    { label: '2%', value: 0.02 },
    { label: '3%', value: 0.03 },
    { label: '4%', value: 0.04 },
    { label: '5%', value: 0.05 },
  ];
    
  return (
    <div>
      <div>Slippage Bps Tolerance</div>
      <Radio.Group
        value={value}
        options={options}
        onChange={setRadioButton}
        optionType="button"
        buttonStyle="solid"
      />
    </div>
  );
}

export default SlippageBps;
