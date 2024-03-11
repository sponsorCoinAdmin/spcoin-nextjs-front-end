'use client'
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React from 'react'

//   useEffect(() => {
//     router.push('https://www.youtube.com');
//   }, []);

function RecipientAddress({params}: {params: {address:string}}) {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const router = useRouter();
    let url = searchParams.get('url');
    const name = searchParams.get('name');
    const symbol = searchParams.get('symbol');
    const img = searchParams.get('img');
    // if (url != null)
    //     router.push(url);
  return (
    <>
        <div> 
        searchParams = {searchParams}
        </div>
        <div> 
            Name = {name}
        </div>
        <div> 
            Details about Recipient Address {params.address}
        </div>
        <div> 
            pathname = {pathname}
        </div>
        <div> 
            Symbol = {symbol}
        </div>
        <div> 
            Image = {img}
        </div>
         <div> 
            URL = {url}
        </div>
    </>
  )
}

export default RecipientAddress
