import styles from '../styles/SpCoin.module.css'
import spCoin_png from './images/spCoin.png'

import React, { useState, useEffect } from "react";
import { Input, Popover, Radio, Modal, message } from "antd";
import {
  ArrowDownOutlined,
  DownOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import tokenEthList from "./data/tokenEthList.json";
import tokenPolyList from "./data/tokenPolyList.json";

// ToDo Fix this
import Image from 'next/image'

import axios from "axios";
import { useSendTransaction, useWaitForTransaction } from "wagmi";

function Swap(props) {
  let tokenList = tokenEthList;
  // let { tokenList, setTokenList } = useState(tokenEthList);
  // let { address, isConnected } = props;
  // alert(JSON.stringify(tokenList,null,2))
  let { address, isConnected } = props;
  let [messageApi, contextHolder] = message.useMessage();
  let [slippage, setSlippage] = useState(2.5);
  let [tokenOneAmount, setTokenOneAmount] = useState(null);
  let [tokenTwoAmount, setTokenTwoAmount] = useState(null);
  let [tokenOne, setTokenOne] = useState(tokenList[0]);
  let [tokenTwo, setTokenTwo] = useState(tokenList[1]);
  let [isOpen, setIsOpen] = useState(false);
  let [changeToken, setChangeToken] = useState(1);
  let [prices, setPrices] = useState(null);
  let [txDetails, setTxDetails] = useState({
    to: null,
    data: null,
    value: null,
  }); 





  let [showModal, setShowModal] = useState(false);


  /*
  const {data, sendTransaction} = useSendTransaction({
    request: {
      from: address,
      to: String(txDetails.to),
      data: String(txDetails.data),
      value: String(txDetails.value),
    }
  })

  const { isLoading, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  })

  function changeNetwork(e) {
    // setTokenList(e.target.value);
  }

*/
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

/*
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

    let status
    await axios.get(`http://localhost:3001/tokenPrice`, {
        params: {addressOne: one, addressTwo: two}
      }).then((res) => {
        let data = res.data;
        if (data.tokenOneStatus === 200 && data.tokenTwoStatus == 200) { 
            setPrices(data)
          }
          else {
            alert(`{ ERROR:\n, ${JSON.stringify(data, null, 2)} }`)
          }
        }).catch((err) => {
          let msg = `{ ERROR: ${JSON.stringify(err, null, 2)} }`
          alert(msg)
          console.log(msg);
          throw err
      })
  }
*/
  async function fetchDexSwap(){

    const allowance = await axios.get(`https://api.1inch.io/v5.0/1/approve/allowance?tokenAddress=${tokenOne.address}&walletAddress=${address}`)
  
    if(allowance.data.allowance === "0") {
      const approve = await axios.get(`https://api.1inch.io/v5.0/1/approve/transaction?tokenAddress=${tokenOne.address}`)
      setTxDetails(approve.data);
      console.log("not approved")
      return
    }

    const tx = await axios.get(
      `https://api.1inch.io/v5.0/1/swap?fromTokenAddress=${tokenOne.address}&toTokenAddress=${tokenTwo.address}&amount=${tokenOneAmount.padEnd(tokenOne.decimals+tokenOneAmount.length, '0')}&fromAddress=${address}&slippage=${slippage}`
    )

    let decimals = Number(`1E${tokenTwo.decimals}`)
    setTokenTwoAmount((Number(tx.data.toTokenAmount)/decimals).toFixed(2));

    setTxDetails(tx.data.tx);
  
  }
/*

  useEffect(()=>{

    fetchPrices(tokenList[0].address, tokenList[1].address)

  }, [])

  useEffect(()=>{

      if(txDetails.to && isConnected){
        sendTransaction();
      }
  }, [txDetails])

  useEffect(()=>{

    messageApi.destroy();

    if(isLoading){
      messageApi.open({
        type: 'loading',
        content: 'Transaction is Pending...',
        duration: 0,
      })
    }    

  },[isLoading])

  useEffect(()=>{
    messageApi.destroy();
    if(isSuccess){
      messageApi.open({
        type: 'success',
        content: 'Transaction Successful',
        duration: 1.5,
      })
    }else if(txDetails.to){
      messageApi.open({
        type: 'error',
        content: 'Transaction Failed',
        duration: 1.50,
      })
    }
  },[isSuccess])
*/

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
      {contextHolder}
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
                <img src={e.img} alt={e.ticker} className={styles.tokenLogo} />
                <div className={styles.tokenChoiceNames}>
                  <div className={styles.tokenName}>{e.name}</div>
                  <div className={styles.tokenTicker}>{e.ticker}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Modal>
      <div className={styles.tradeBox}>
        <div className={styles.tradeBoxHeader}>
        <Image src={spCoin_png} width={25} height={25} alt="Moralis Logo" />
          <h4 className={styles.center}>Sponsor Coin Exchange</h4>
          <Popover
            content={settings}
            title="Settings"
            trigger="click"
            placement="bottomLeft"
            className={styles.cog}
          >
          <SettingOutlined className={styles.cog} />
          </Popover>
        </div>
        <div className={styles.inputs}>
          <Input className={styles.priceInput} placeholder="0" value={tokenOneAmount} onChange={changeAmount} disabled={!prices} />
          <Input className={styles.priceInput} placeholder="0" value={tokenTwoAmount} disabled={true} />
          <div className={styles.swapButton} disabled={!tokenOneAmount || !isConnected} onClick={fetchDexSwap}>Swap</div>
          <div className={styles.switchButton} onClick={switchTokens}>
            <ArrowDownOutlined className={styles.switchArrow} />
          </div>
          <div className={styles.assetOne} onClick={() => openModal(1)}>
            <img src={tokenOne.img} alt="assetOneLogo" className={styles.assetLogo} />
            {tokenOne.ticker}
            <DownOutlined />
          </div>
          <div className={styles.assetTwo} onClick={() => openModal(2)}>
            <img src={tokenTwo.img} alt="assetOneLogo" className={styles.assetLogo} />
            {tokenTwo.ticker}
            <DownOutlined />
          </div>
        </div>
      </div>
    </>
  );
}

export default Swap;
