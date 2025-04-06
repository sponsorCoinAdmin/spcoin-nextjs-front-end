import * as React from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi'

const WagmiConnect = () => {
    const account = useAccount()
    const { disconnect } = useDisconnect()
    const { connectors, connect, status, error } = useConnect()

  return (
    <div>
        <h2>Connect Accounts</h2>
        {account.status === 'connected' && (
          <button type="button" onClick={() => disconnect()}>
            Disconnect
          </button>
        )}
        {account.status !== 'connected' && connectors.map((connector) => (
          <button
            key={connector.uid}
            onClick={() => connect({ connector })}
            type="button"
          >
            {connector.name}
          </button>
        ))}
        {error === null ? null : "Error Status: " + error?.message } <br />
        {status === null ? null : "Status: " + status } <br/>
        {account.status === null ? null : "Connection Status : " + account.status } <br />
        {account.chainId === null ? null : "chainId: " + account.chainId } <br />
        {account.addresses === null ? null : "Connected Accounts:" + JSON.stringify(account.addresses, null, 2)} <br />
        {account.address === null ? null : "Active Wallet Account:" + JSON.stringify(account.address, null, 2)} <br />
    </div>
  );
}

export default WagmiConnect;
