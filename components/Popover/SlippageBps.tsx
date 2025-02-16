import React, { useEffect, useState } from 'react'
import { type RadioChangeEvent, Radio } from "antd";
import styles from '@/styles/Exchange.module.css';

function SlippageBps({initialSlippageBps, setSlippageBpsCallback}:any) {

  const [value, setValue] = useState("0.02");
  useEffect(() => {
    // console.log (`setting Initial slippageBps value`+ value)
    setValue(initialSlippageBps)
  }, []);

  const setRadioButton = ({ target: { value } }: RadioChangeEvent) => {
    console.log('radio checked ' + value);
    setValue(value);
    setSlippageBpsCallback(value)
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
      <div >slippageBps Tolerance</div>
      <Radio.Group value={value}
          options={options}
          onChange={setRadioButton}
          optionType="button"
          buttonStyle="solid"
          />
    </div>
  )
}

export default SlippageBps
