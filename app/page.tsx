// 'use client'
import styles from "../styles/App.module.css";
import Header from "./header"

import Agents from "./components/Agents";
import Recipients from "./components/Recipients";
import Swap from "./components/Swap";
import Tokens from "./components/Tokens";

import { useConnect, useAccount } from "wagmi";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";

function App() {
  // const { address, isConnected } = useAccount();
  // const { connect } = useConnect({
  //   connector: new MetaMaskConnector(),
  // });

  return (

    <div className="styles.App">
      <Header />
      {/* <Header connect={connect} isConnected={isConnected} address={address} /> */}
      <div className="styles.mainWindow">
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