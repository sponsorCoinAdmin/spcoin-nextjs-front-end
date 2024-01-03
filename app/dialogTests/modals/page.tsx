import Link from "next/link"
import AgentDlgLstBtn from '../../components/Dialogs/Buttons/AgentDlgLstBtn'
import RecipientDlgLstBtn from '../../components/Dialogs/Buttons/RecipientDlgLstBtn'
import DlgDataLstBtn from '../../components/Dialogs/Buttons/DlgDataLstBtn'

export default function Products() {

    type ListElement = {
        chainId: number;
        symbol: string;
        img: string;
        name: string;
        address: string;
        decimals: number;
      }

    const setDlgLstElement = async(listElement: ListElement) => {
        "use server"
        console.log("Modifying Token Object FROM AgentDlgLstBtn.tsx" + JSON.stringify(listElement,null,2));
      }
    
      async function onClose() {
        "use server"
        console.log("Modal has closed")
    }

    return (
    <>
        <h1 className="text-5xl">Dialog Test</h1>

        <AgentDlgLstBtn setDlgLstElement={setDlgLstElement} onClose={onClose}/>
        <RecipientDlgLstBtn setDlgLstElement={setDlgLstElement} onClose={onClose}/>
        <DlgDataLstBtn setDlgLstElement={setDlgLstElement} onClose={onClose} />

        <Link href="/dialogTests" className="text-3xl underline">Go to Dialog Tests</Link>
        <Link href="/" className="text-3xl underline">Home</Link>
    </>
    )
}