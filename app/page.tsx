// 'use client'
import Header from "./components/panes/header"


function App() {
  // const { address, isConnected } = useAccount();
  // const { connect } = useConnect({
  //   connector: new MetaMaskConnector(),
  // });

  return (

      <div>
        <Header address={undefined} isConnected={undefined} connect={undefined} headerType={""} />
      </div>
  )
}

export default App;