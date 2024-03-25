'use client'
import styles from '@/app/styles/Exchange.module.css';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React from 'react'

//   useEffect(() => {
//     router.push('https://www.youtube.com');
//   }, []);

async function fetchText(target:any, url: string): Promise<any> {
    fetch('https://ca.yahoo.com/?p=us') // <---- notice 
    .then(
        async function(response)
        {
          alert(response.status)
          target.innerHTML = await response.text();

        }
    )
    .catch(function(err:any)
    {
       alert('Fetch Error : '+ err);
    });
  }

function RecipientAddress({params}: {params: {address:string}}) {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const router = useRouter();
    const url = searchParams.get('url');
    const name = searchParams.get('name');
    const address = searchParams.get('address');
    const symbol = searchParams.get('symbol');
    const img = searchParams.get('img');
    // if (url != null)
    //     router.push(url);
    const showSite = (url:any) => {
        let recipientTarget = document.getElementById("RecipientTarget")
        if (recipientTarget)
            recipientTarget.innerHTML = url;
        fetchText(recipientTarget, url)
        // if (url != null)
        //  router.push(url);
    }
    return (
        // <div className={styles["center-screen"]}>
        //     <div> 
        //         pathname = {pathname}
        //     </div>
        //     <div> 
        //         Name = {name}
        //     </div>
        //     <div> 
        //         Symbol = {symbol}
        //     </div>
        //     <div> 
        //         Address {address}
        //     </div>
        //     <div> 
        //         Image = {img}
        //     </div>
        //     <div className={styles["select"]} onClick={() => { showSite(url) }}>
        //         URL = {url}
        //     </div>
        //     <div id="RecipientTarget"></div>
            
        <div> 
            <iframe src={url?url:"NotFound"} 
                width="100%"
                height="700px"/>
        </div>
    )
}

export default RecipientAddress
