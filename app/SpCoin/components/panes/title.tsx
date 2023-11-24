import React from 'react'
import MoralisHeader from './moralisHeader';
import TestHeader from '../testModal/testHeader';
import styles from "../../styles/App.module.css";

function Header(props: { address: any; isConnected: any; connect: any; headerType: string}) {
  const {address, isConnected, connect, headerType} = props;
  let header = MoralisHeader(address, isConnected, connect);
  // let header = TestHeader(address, isConnected, connect);

  return (
    <header>
      {header}
    </header>
  );
}

export default Header;
