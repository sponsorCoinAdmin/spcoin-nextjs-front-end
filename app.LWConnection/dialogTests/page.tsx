import Link from "next/link"

export default function Home() {
  return (
    <>
      <h1 className="text-5xl">Dialog Tests</h1>
      <Link href="/dialogTests/modals?showDialog=y" className="text-3xl underline">Go to dialog Tests with OPEN Modal</Link>
      <Link href="/dialogTests/modals?showDialog=n" className="text-3xl underline">Go to dialog Tests with HIDDEN Modal</Link>
      <Link href="/" className="text-3xl underline">Home</Link>
    </>
  )
}
