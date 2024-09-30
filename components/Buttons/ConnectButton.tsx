'use client'

import React from "react";
import { ConnectKitButton } from "connectkit";
import connectTheme from "@/styles/connectTheme.json"

function ConnectButton() {
  return (
    <>
      {<ConnectKitButton customTheme={connectTheme}/>}
    </>
  );
}

export default ConnectButton;
