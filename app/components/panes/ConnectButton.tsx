'use client'

import React from "react";
import { ConnectKitButton } from "connectkit";

import connectTheme from "../../styles/connectTheme.json"
import ConnectWrapper from "../ConnectWrapper";


function ConnectTheme() {
  return (
    <>
      {<ConnectKitButton customTheme={connectTheme}/>}
    </>
  );
}

function ConnectButton() {
  return (
    <>
      {/* {<ConnectTheme />} */}
      <ConnectWrapper Component={ConnectTheme} />
    </>
  );
}
export default ConnectButton;
