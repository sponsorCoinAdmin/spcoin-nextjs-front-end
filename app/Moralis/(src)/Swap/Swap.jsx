'use client'
import styles from '../App.module.css'

import React, { useState, useEffect } from "react";
// import { Input, Popover, Radio, Modal, message } from "antd";
// import {
//   ArrowDownOutlined,
//   DownOutlined,
//   SettingOutlined,
// } from "@ant-design/icons";
// import tokenEthList from "../../../components/data/tokenEthList.json";
// import tokenPolyList from "../../../components/data/tokenPolyList.json";
// import axios from "axios";
// import { useSendTransaction, useWaitForTransaction } from "wagmi";

// import React from 'react'

function Swap() {
  return (
    <>
      <h1 className={styles.center}>Moralis Swap Before TradeBox</h1>
      <div className={styles.tradeBox}></div>
    </>
  )
}

export default Swap
