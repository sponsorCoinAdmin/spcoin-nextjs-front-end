import React from "react";
import ConnectWrapper from "../ConnectWrapper";

function FooterBody() {
  return (
    <footer>
      <h1>Footer</h1>
    </footer>
  );
}

function Footer() {
  return (
    <>
      <ConnectWrapper Component={FooterBody} />
    </>
  );
}

export default Footer;