'use client'

import ConnectWrapper from "@/app/components/ConnectWrapper";
import Component from './index'

import React from 'react'

function connectedPage() {
  return (
    <>
       <ConnectWrapper Component={Component} />
    </>
  )
}

export default connectedPage
