// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import qs from "qs";
import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  name: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  console.log("QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ")
  console.log("Using Page Quote")
  const query = qs.stringify(req.query);

  let apiQuery = `https://polygon.api.0x.org/swap/v1/quote?${query}`;
  console.log("Executing Quote Request: " + apiQuery)

  const response = await fetch(
    `https://polygon.api.0x.org/swap/v1/quote?${query}`,
    {
      headers: {
        "0x-api-key": "a1d0f41d-3b72-4a50-b3b5-6f10cd534bd7", // process.env.NEXT_PUBLIC_0X_API_KEY,
      },
    }
  );

  const data = await response.json();

  res.status(200).json(data);
}
