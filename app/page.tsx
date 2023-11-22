// 'use client'
import Header from "./components/layout/header"

import Agents from "./components/menuTabs/Agents";
import Recipients from "./components/menuTabs/Recipients";
import Swap from "./components/menuTabs/Swap";
import Tokens from "./components/menuTabs/Tokens";

import { useConnect, useAccount } from "wagmi";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";

function App() {
  // const { address, isConnected } = useAccount();
  // const { connect } = useConnect({
  //   connector: new MetaMaskConnector(),
  // });

  return (

    <div>
      <div>
        {/* <Routes>
          <Route path="/" element={<Swap isConnected={isConnected} address={address} />} />
          <Route path="/Agents" element={<Agents />} />
          <Route path="/tokens" element={<Tokens />} />
          <Route path="/Recipients" element={<Recipients />} />
        </Routes> */}
      </div>

    </div>
  )
}

export default App;





  //  export default function Home() {
  //   return (
  //     <>
  //       <Header />
  //       <h1>Hello</h1>
  //     </>
  //   )
  // }