import * as React from 'react';
import { BLOCKCHAIN_PROVIDER } from '@/lib/wagmi/wagmiConfig';

const ProviderConfigurationStatus = () => {
  return (
    <div>
    <h2>Provider Configuration Status</h2>
    <div>
      Blockchain Provider = {BLOCKCHAIN_PROVIDER} <br />
      {/* TokenContract Data: {stringifyBigInt("contract")} <br /> */}
    </div>
  </div>
);
}

export default ProviderConfigurationStatus;
