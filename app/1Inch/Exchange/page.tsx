'use client'

import React from 'react'
import Component from './App'
import ConnectWrapper from '@/app/components/ConnectWrapper'

function Home() {
  return (
    <div className="mainApp">
      <ConnectWrapper Component={Component} />
    </div>
  )
}

export default Home