export async function GET(req: Request) {
  console.log("Hello World")
  return new Response(JSON.stringify("Hello World"))
}
