<!-- File: app/api/spCoin/tokens/README.md -->
# SponsorCoin Tokens API Usage

This folder contains token APIs:

- `GET /api/spCoin/tokens`
- `POST /api/spCoin/tokens`
- `GET /api/spCoin/tokens/{chainId}/{tokenAddress}`
- `PUT|POST /api/spCoin/tokens/{chainId}/{tokenAddress}`

## 1) List Seed Token Addresses

Endpoint:

- `GET /api/spCoin/tokens?chainId=8453`

Behavior:

- Returns token addresses from the app-defined seed list for that chain:
  - `resources/data/networks/<network>/tokenList.json`
- Addresses are normalized to lowercase `0x...`.

Example:

```bash
curl -s "http://localhost:3000/api/spCoin/tokens?chainId=8453"
```

## 2) List Seed Tokens Across All Networks

Endpoint:

- `GET /api/spCoin/tokens?allNetworks=true`

Behavior:

- Returns `{ chainId, address }` rows for all configured token seed lists.

Example:

```bash
curl -s "http://localhost:3000/api/spCoin/tokens?allNetworks=true"
```

## 3) List Tokens With Full Data (Paged)

Endpoint:

- `GET /api/spCoin/tokens?allData=true&chainId=8453&page=1&pageSize=25`
- `GET /api/spCoin/tokens?allData=true&allNetworks=true&page=1&pageSize=25`

Query params:

- `allData=true` enables full token payload mode.
- `page` default `1`.
- `pageSize` default `25`, max `200`.
- Must provide either `chainId` or `allNetworks=true`.

Notes:

- Full token records are read from:
  - `public/assets/blockchains/{chainId}/contracts/{0XADDRESS}/info.json`
- Missing `info.json` entries are skipped in `items`.

Example:

```bash
curl -s "http://localhost:3000/api/spCoin/tokens?allData=true&chainId=8453&page=1&pageSize=10"
```

## 4) Read Single Token

Endpoint options:

- `GET /api/spCoin/tokens/{chainId}/{tokenAddress}`
- `GET /api/spCoin/tokens?chainId=8453&address=0x...`

Example:

```bash
curl -s "http://localhost:3000/api/spCoin/tokens/8453/0x4200000000000000000000000000000000000006"
```

## 5) Batch Read Tokens (POST)

Endpoint:

- `POST /api/spCoin/tokens`

Body format A:

- `{ "chainId": 8453, "addresses": ["0x...", "0x..."] }`

Body format B:

- `{ "requests": [{ "chainId": 8453, "address": "0x..." }, { "chainId": 1, "address": "0x..." }] }`

Example:

```bash
curl -X POST "http://localhost:3000/api/spCoin/tokens" \
  -H "Content-Type: application/json" \
  -d "{\"chainId\":8453,\"addresses\":[\"0x4200000000000000000000000000000000000006\"]}"
```

## 6) Write info.json

Endpoint:

- `PUT /api/spCoin/tokens/{chainId}/{tokenAddress}?target=info`
- `POST /api/spCoin/tokens/{chainId}/{tokenAddress}?target=info`

Body:

- JSON object written to:
  - `public/assets/blockchains/{chainId}/contracts/{0XADDRESS}/info.json`

Example:

```bash
curl -X PUT "http://localhost:3000/api/spCoin/tokens/8453/0x4200000000000000000000000000000000000006?target=info" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Wrapped Ether\",\"symbol\":\"WETH\",\"decimals\":18}"
```

## 7) Write logo.png

Endpoint:

- `PUT /api/spCoin/tokens/{chainId}/{tokenAddress}?target=logo`
- `POST /api/spCoin/tokens/{chainId}/{tokenAddress}?target=logo`

Supported body formats:

- Raw binary body (example `image/png`)
- `multipart/form-data` with field `file` or `logo`

Example:

```bash
curl -X PUT "http://localhost:3000/api/spCoin/tokens/8453/0x4200000000000000000000000000000000000006?target=logo" \
  -F "file=@./logo.png"
```

## Errors

- `400` invalid chainId/address or invalid request body.
- `404` token not found for read endpoints.
- `500` filesystem/read-write failure.
