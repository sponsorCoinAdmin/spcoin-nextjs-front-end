import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(
  request: Request,
  { params }: { params: { chainId: string } }
) {
  const chainId = params.chainId;
  const infoPath = path.join(
    process.cwd(),
    'public',
    'assets',
    'blockchains',
    `${chainId}`,
    'contracts',
    '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    'info.json'
  );

  console.log(`route.nativeToken:GET ${infoPath}`)
  try {
    if (!fs.existsSync(infoPath)) {
      return NextResponse.json({ error: 'Chain info not found' }, { status: 404 });
    }

    const rawData = fs.readFileSync(infoPath, 'utf-8');
    const data = JSON.parse(rawData);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to read token info' }, { status: 500 });
  }
}
