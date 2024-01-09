export async function GET (req: Request) {
  const url=req.url;

  let urlPart = url.split("?");
  let params = urlPart[1];
  let apiQuery = `https://polygon.api.0x.org/swap/v1/price?${params}`;

  console.log("URL      = " + url)
  console.log("Executing Price Request: " + apiQuery)

  const response = await fetch(
    apiQuery,
    {
      headers: {
        "0x-api-key": "a1d0f41d-3b72-4a50-b3b5-6f10cd534bd7", // process.env.NEXT_PUBLIC_0X_API_KEY,
      },
    }
  );

  const data = await response.json();
  console.log("Executed Price Response : " + JSON.stringify(data,null,2))

  return new Response(JSON.stringify(data, null, 2))
} 