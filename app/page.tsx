// 'use client'

import Agents from "./components/menuTabs/Agents";
import Recipients from "./components/menuTabs/Recipients";
import Swap from "./components/menuTabs/Swap";
import Tokens from "./components/menuTabs/Tokens";

import { useConnect, useAccount } from "wagmi";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import Header from "./components/panes/header"


function App() {
  // const { address, isConnected } = useAccount();
  // const { connect } = useConnect({
  //   connector: new MetaMaskConnector(),
  // });

  return (

      <div>
        <Header address={undefined} isConnected={undefined} connect={undefined} headerType={""} />
        {/* <Routes>
          <Route path="/" element={<Swap isConnected={isConnected} address={address} />} />
          <Route path="/Agents" element={<Agents />} />
          <Route path="/tokens" element={<Tokens />} />
          <Route path="/Recipients" element={<Recipients />} />
        </Routes> */}
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