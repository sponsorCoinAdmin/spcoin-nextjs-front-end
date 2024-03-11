'use client'

import React, { useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

function Recipient() {

  const pathname = usePathname()
  const searchParams = useSearchParams()
  // let target = document.querySelector(".RecipientContainer")
  const target:any = document.getElementById("RecipientContainer")

//   const router = useRouter();
//   useEffect(() => {
//     router.push('https://www.youtube.com');
//   }, []);
useEffect(() => {
    alert(`pathname: ${pathname}\n searchParams: ${searchParams}`)
    alert(`target: ${target}`)

    // fetchText("www.youtube.com")

    // Do something here...
  }, [])


  const loadData = (url:string) => {
    fetch(url)
      .then(function (response) {
        // console.log(url + " -> " + response.ok);
        if(response.ok){
          alert ("RecipientContainer response.ok")
          return response.text();
        }
        alert("loadData:Error message." + response.status)
        // throw new Error('Error message.');
      })
      .then(recipientData => {
        target.innerHTML = recipientData;
        console.log("data: ", recipientData);
      });
  }

  async function fetchText(url: string): Promise<any> {
    fetch('http://localhost:3000/Exchange') // <---- notice 
    .then(
        function(response)
        {
          alert(response.status)
          target.innerHTML = "<h1>JUNK</h1>";

        }
    )
    .catch(function(err:any)
    {
       alert('Fetch Error : '+ err);
    });
  }

  //////////////////////////////////////////////////////////
  // loadData2("https://www.youtube.com")
  // fetchText("https://www.youtube.com")

  return (
    <div onLoad={() => alert('XXX LOADED')} id="RecipientContainer" className="mainApp"><h1>Sponsor Coin Recipient Page</h1></div>
  )
}

export default Recipient