'use client'
import React, { useState } from "react";
import styles from '../styles/Exchange.module.css'

let updateNetworkState: (e:any) => void;

function NewEmployee() {
  const [networkData,setNetworkData]=useState({chainId:'1',Name:'Ethereum'});    

  function changeNetworkInfo(e:any){
    console.log(e);
    setNetworkData({...networkData,[e.target.name]:e.target.value});
  }

  updateNetworkState = changeNetworkInfo

  return(
    <div>
      <h2>Welcome to Employee Component...</h2>
      <p>
        <label>Chain ID :
          <input type="text" name="chainId" className={styles.priceInput} value={networkData.chainId}
          onChange={changeNetworkInfo}></input>
        </label>
      </p>
      <p>
        <label>Network Name: 
          <input type="text" name="Name" className={styles.priceInput} value={networkData.Name}
          onChange={changeNetworkInfo}></input>
        </label>
      </p>
      <p>
        Network ID is : <b>{networkData.chainId}</b>, Network Name is : <b>{networkData.Name}</b>
      </p>
      <ExchangeComponent salary={networkData.Name}></ExchangeComponent>
    </div>
  )
}

const ExchangeComponent=({salary})=>{
  function changeExchange(e:any){
    updateNetworkState(e);
  }
  return(
    <div style={{border:'3px solid red', width:'500px'}}>
      <h2>Welcome to Network Component</h2>
    <p>
        <label>Network Name : 
                <input type="text" name="Name" className={styles.priceInput} value={salary}
                onChange={changeExchange}></input>
        </label>
      </p>
    </div>
  );
}

// ReactDOM.render(element,document.getElementBychainId("root"));

function Admin() {
  return (
    <div>
      <h1>Test Page</h1>
      <NewEmployee></NewEmployee>
    </div>
  )
}

export default Admin