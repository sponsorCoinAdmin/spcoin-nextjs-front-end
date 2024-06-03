import React from 'react';
import { BLOCKCHAIN_PROVIDER } from '@/lib/wagmi/config';

const ProviderConfigurationStatus = () => {
  return (
    <div>
    <h2>Provider Configuration Status</h2>
    <div>
      Blockchain Provider = {BLOCKCHAIN_PROVIDER} <br />
      {/* TokenContract Data: {JSON.stringify(contract, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2)} <br /> */}
    </div>
  </div>
);
}

export default ProviderConfigurationStatus;
