import React from "react";
import Logo from "./images/moralis-logo.svg";
import Eth from "./images/eth.svg";

import Image from 'next/image'
import Link from 'next/link'
// import { Link } from "react-router-dom";

function Header(props) {

  const {address, isConnected, connect} = props;

  // alert(`isConnected = ${isConnected}\naddress = ${address}\n\connect = ${JSON.stringify(connect,null,2)}\n`)
  // alert(`HEADER:\nprops = ${JSON.stringify(props,null,2)}`)

  return (
    <header>
      <div className="leftH">
        <img src={Logo} alt="logo" className="logo" />
        {/* <Link to="/" className="link"> */}
          {/* <div className="headerItem">Swap</div> */}
          <div><Link href="/1Inch/Exchange/Swap" props={props}>Swap</Link></div>
        {/* </Link>
        <Link to="/tokens" className="link"> */}
          {/* <div className="headerItem">Tokens</div> */}
          <div><Link href="/1Inch/Exchange/Tokens">Tokens</Link></div>
        {/* </Link> */}
      </div>
      <div className="rightH">
        <div className="headerItem">
          <img src={Eth} alt="eth" className="eth" />
          Ethereum
        </div>
        <div className="connectButton" onClick={connect}>
          {isConnected ? (address.slice(0,4) +"..." +address.slice(38)) : "Connect"}
        </div>
      </div>
    </header>
  );
}

export default Header;
