'use client'
import ReactDOM from "react-dom";
import React, { Component, useState } from "react";
import styles from '../styles/Exchange.module.css'

function NewEmployee(){
  const [employee,setEmployeeData]=useState({Id:'',Name:'',Location:'',Salary:''});    

  function changeEmployeeInfo(e){
    console.log(e);
    setEmployeeData({...employee,[e.target.name]:e.target.value});
  }

  return(
    <div>
      <h2>Welcome to Employee Component...</h2>
      <p>
        <label>Employee ID :
                <input type="text" name="Id" value={employee.Id}
                onChange={changeEmployeeInfo}></input>
        </label>
      </p>
      <p>
        <label>Employee Name : 
                <input type="text" name="Name" value={employee.Name} 
                onChange={changeEmployeeInfo}></input>
        </label>
      </p>
      <p>
        <label>Employee Location :
                <input type="text" name="Location" value={employee.Location}
                onChange={changeEmployeeInfo}></input>
        </label>
      </p>
      <p>
        <label>Employee Salary : 
                <input type="text" name="Salary" className={styles.priceInput} value={employee.Salary}
                onChange={changeEmployeeInfo}></input>
        </label>
      </p>
      <p>
        Employee ID is : <b>{employee.Id}</b>, Name is : <b>{employee.Name}</b> ,
         Location is : <b>{employee.Location}</b> and Salary is : <b>{employee.Salary}</b>
      </p>
      <SalaryComponent onSalaryChange={changeEmployeeInfo} salary={employee.Salary}></SalaryComponent>
    </div>
  )
}

const SalaryComponent=({onSalaryChange,salary})=>{
  function changeSalary(e){
    onSalaryChange(e);
  }
  return(
    <div style={{border:'3px solid red', width:'500px'}}>
      <h2>Welcome to Salary Component</h2>
    <p>
        <label>Employee Salary : 
                <input type="text" name="Salary" className={styles.priceInput} value={salary}
                onChange={changeSalary}></input>
        </label>
      </p>
    </div>
  );
}

// ReactDOM.render(element,document.getElementById("root"));

function Admin() {
  return (
    <div>
      <h1>Test Page</h1>
      <NewEmployee></NewEmployee>
    </div>
  )
}

export default Admin