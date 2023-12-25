'use client'
import styles from './styles/Moralis.module.css'
import moralis_png from './components/images/moralis.png'

import React, { useState, useEffect } from "react";
import { Input, Popover, Radio, Modal, message } from "antd";
import {
  ArrowDownOutlined,
  DownOutlined,
  SettingOutlined,
} from "@ant-design/icons";

import tokenEthList from "../../components/data/tokenEthList.json";
import tokenPolyList from "../../components/data/tokenPolyList.json";

// ToDo Fix this
import Image from 'next/image'

import axios from "axios";
import { useSendTransaction, useWaitForTransaction } from "wagmi";

function Swap(props) {
  let [slippage, setSlippage] = useState(2.5);
  let [tokenOneAmount, setTokenOneAmount] = useState(null);
  let [tokenTwoAmount, setTokenTwoAmount] = useState(null);
  let [tokenOne, setTokenOne] = useState(tokenList[0]);
  let [tokenTwo, setTokenTwo] = useState(tokenList[1]);
  let [isOpen, setIsOpen] = useState(false);
  let [changeToken, setChangeToken] = useState(1);
  let [prices, setPrices] = useState(null);



  let [showModal, setShowModal] = useState(false);

  function handleSlippageChange(e) {
    setSlippage(e.target.value);
  }

  function changeAmount(e) {
    setTokenOneAmount(e.target.value);
    if(e.target.value && prices){
      setTokenTwoAmount((e.target.value * prices.ratio).toFixed(2))
    } else {
      setTokenTwoAmount(null);
    }
  }

  function switchTokens() {
    setPrices(null);
    setTokenOneAmount(null);
    setTokenTwoAmount(null);
    const one = tokenOne;
    const two = tokenTwo;
    setTokenOne(two);
    setTokenTwo(one);
    fetchPrices(two.address, one.address);
  }

  function openModal(asset) {
    setChangeToken(asset);
    setIsOpen(true);
  }

/**/
  function modifyToken(i){
    // console.log(`modifyToken(${i})`)
    setPrices(null);
    setTokenOneAmount(null);
    setTokenTwoAmount(null);
    if (changeToken === 1) {
      setTokenOne(tokenList[i]);
      fetchPrices(tokenList[i].address, tokenTwo.address)
    } else {
      setTokenTwo(tokenList[i]);
      fetchPrices(tokenOne.address, tokenList[i].address)
    }
    setIsOpen(false);
  }

  async function fetchPrices(one, two){
    await axios.get(`http://localhost:3001/tokenPrice`, {
        params: {addressOne: one, addressTwo: two}
      }).then((res) => {
        let data = res.data;
        if (data.tokenOneStatus === 200 && data.tokenTwoStatus == 200) { 
            setPrices(data)
          }
          else {
            // alert(`{ ERROR:\n, ${JSON.stringify(data, null, 2)} }`)
          }
        }).catch((err) => {
          let msg = `{ ERROR: ${JSON.stringify(err, null, 2)} }`
          // alert(msg)
          console.log(msg);
          throw err
      })
  }

  const settings = (
    <div>
      <div >Slippage Tolerance</div>
      <div >
        <Radio.Group value={slippage} onChange={handleSlippageChange}>
          <Radio.Button value={0.5}>0.5%</Radio.Button>
          <Radio.Button value={2.5}>2.5%</Radio.Button>
          <Radio.Button value={5}>5.0%</Radio.Button>
        </Radio.Group>
      </div>
    </div>
  );

  return (
    <>
      <Modal
        open={isOpen}
        footer={null}
        onCancel={() => setIsOpen(false)}
        title="Select a token"
        contentBg={"243056"}

        style={{ background: 'orange'}}
        className={styles.antPopoverInner}
      >
        <div className={styles.modalContent}>  // for token list popover
          {tokenList?.map((e, i) => {
            return (
              <div
                className={styles.tokenChoice}
                key={i}
                onClick={() => modifyToken(i)}
              >
                <img src={e.img} alt={e.symbol} className={styles.tokenLogo} />
                <div className={styles.tokenChoiceNames}>
                  <div className={styles.tokenName}>{e.name}</div>
                  <div className={styles.tokensymbol}>{e.symbol}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Modal>
      <div className={styles.tradeBox}>
        <div className={styles.tradeBoxHeader}>
        <Image src={moralis_png} width={25} height={25} alt="Moralis Logo" />
          <h4 className={styles.center}>Moralis Exchange</h4>
          <Popover
            content={settings}
            title="Settings"
            trigger="click"
            placement="bottomLeft"
          >
          <SettingOutlined className={styles.cog} />
          </Popover>
        </div>
        <div className={styles.inputs}>
          <Input className={styles.priceInput} placeholder="0" value={tokenOneAmount} onChange={changeAmount} disabled={!prices} />
          <Input className={styles.priceInput} placeholder="0" value={tokenTwoAmount} disabled={true} />
          <div className={styles.switchButton} onClick={switchTokens}>
            <ArrowDownOutlined className={styles.switchArrow} />
          </div>
          <div className={styles.assetOne} onClick={() => openModal(1)}>
            <img src={tokenOne.img} alt="assetOneLogo" className={styles.assetLogo} />
            {tokenOne.symbol}
            <DownOutlined />
          </div>
          <div className={styles.assetTwo} onClick={() => openModal(2)}>
            <img src={tokenTwo.img} alt="assetOneLogo" className={styles.assetLogo} />
            {tokenTwo.symbol}
            <DownOutlined />
          </div>
        </div>
        {/* <div className={styles.swapButton} disabled={!tokenOneAmount || !isConnected} onClick={alert("ToDo")}>Swap</div> */}
      </div>
    </>
  );
}

export default Swap;
