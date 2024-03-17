'use client'

import React, { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation';

function Recipient() {

  const pathname = usePathname()
  const searchParams = useSearchParams()
//   const router = useRouter();
//   useEffect(() => {
//     router.push('https://www.youtube.com');
//   }, []);
useEffect(() => {
    alert(`pathname: ${pathname}\n searchParams: ${searchParams}`)

  }, [])

  //////////////////////////////////////////////////////////
  // loadData2("https://www.youtube.com")
  // fetchText("https://www.youtube.com")

  return (
    <div onLoad={() => alert('XXX LOADED')} id="RecipientContainer" className="mainApp"><h1>Sponsor Coin Recipient Page</h1></div>
  )
}

export default Recipient