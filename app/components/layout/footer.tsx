import React from "react";

function Footer(props: { address: any; isConnected: any; connect: any; }) {
  const {address, isConnected, connect} = props;

  return (
    <footer>
      <h1>Footer</h1>
    </footer>
  );
}

export default Footer;
