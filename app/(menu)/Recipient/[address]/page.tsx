'use client'
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React from 'react'
async function fetchText(target:any, url: string): Promise<any> {
    fetch('https://ca.yahoo.com/?p=us') // <---- notice 
    .then(
        async function(response)
        {
        //   alert(response.status)
          target.innerHTML = await response.text();

        }
    )
    .catch(function(err:any)
    {
       alert('Fetch Error : '+ err);
    });
  }

function RecipientAddress({params}: {params: {address:string}}) {
    const searchParams = useSearchParams()
    const url = searchParams.get('url');
    return (
        <div> 
            <iframe src={url?url:"NotFound"} 
                width="100%"
                height="700px"/>
        </div>
    )
}

export default RecipientAddress
