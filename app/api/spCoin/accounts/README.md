<!-- File: app/api/spCoin/accounts/README.md -->
# SponsorCoin Accounts API Usage

This folder contains two account APIs:

- `GET /api/spCoin/accounts`
- `POST /api/spCoin/accounts`
- `GET /api/spCoin/accounts/{accountAddress}`
- `PUT|POST /api/spCoin/accounts/{accountAddress}`

## Auth Configuration (Required for Writes)

Write routes require account-signature auth and bearer token validation.

Set one of:

- `SPCOIN_AUTH_SECRET` (preferred)
- `NEXTAUTH_SECRET`
- `JWT_SECRET`

For multi-server deployments, configure shared nonce/rate-limit state:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## 1) List Accounts

Endpoint:

- `GET /api/spCoin/accounts`

Behavior:

- Returns account addresses from directory names under `public/assets/accounts`.
- Addresses are normalized to lowercase `0x...`.

Example:

```bash
curl -s "http://localhost:3000/api/spCoin/accounts"
```

Example response:

```json
[
  "0x000000000000000000000000000000000000007e",
  "0x0000000000000000000000000000000000000084"
]
```

## 2) List Accounts With Full Data (Paged)

Endpoint:

- `GET /api/spCoin/accounts?allData=true&page=1&pageSize=25`

Query params:

- `allData=true` enables full `account.json` payload mode.
- `page` default `1`.
- `pageSize` default `25`, max `200`.

Example:

```bash
curl -s "http://localhost:3000/api/spCoin/accounts?allData=true&page=1&pageSize=10"
```

Example response:

```json
{
  "items": [
    {
      "address": "0x000000000000000000000000000000000000007e",
      "data": {
        "address": "0x000000000000000000000000000000000000007e",
        "name": "Agent X"
      }
    }
  ],
  "page": 1,
  "pageSize": 10,
  "totalItems": 78,
  "totalPages": 8,
  "hasNextPage": true
}
```

## 3) Write account.json

Endpoint:

- `PUT /api/spCoin/accounts/{accountAddress}?target=account`
- `POST /api/spCoin/accounts/{accountAddress}?target=account`

Body:

- JSON object (written to `public/assets/accounts/<0XADDRESS>/account.json`).

Example:

```bash
curl -X PUT "http://localhost:3000/api/spCoin/accounts/0x000000000000000000000000000000000000007e?target=account" \
  -H "Authorization: Bearer <SESSION_TOKEN>" \
  -H "Content-Type: application/json" \
  -d "{\"address\":\"0x000000000000000000000000000000000000007e\",\"name\":\"Agent X\",\"symbol\":\"AGX\"}"
```

Example response:

```json
{
  "ok": true,
  "address": "0x000000000000000000000000000000000000007e",
  "target": "account",
  "file": "/assets/accounts/0X000000000000000000000000000000000000007E/account.json"
}
```

## 4) Write logo.png

Endpoint:

- `PUT /api/spCoin/accounts/{accountAddress}?target=logo`
- `POST /api/spCoin/accounts/{accountAddress}?target=logo`

Supported body formats:

- Raw binary body (for example `image/png`)
- `multipart/form-data` with field `file` (or `logo`)

Raw binary example:

```bash
curl -X PUT "http://localhost:3000/api/spCoin/accounts/0x000000000000000000000000000000000000007e?target=logo" \
  -H "Authorization: Bearer <SESSION_TOKEN>" \
  -H "Content-Type: image/png" \
  --data-binary "@./logo.png"
```

Multipart example:

```bash
curl -X PUT "http://localhost:3000/api/spCoin/accounts/0x000000000000000000000000000000000000007e?target=logo" \
  -H "Authorization: Bearer <SESSION_TOKEN>" \
  -F "file=@./logo.png"
```

Example response:

```json
{
  "ok": true,
  "address": "0x000000000000000000000000000000000000007e",
  "target": "logo",
  "bytes": 12345,
  "file": "/assets/accounts/0X000000000000000000000000000000000000007E/logo.png"
}
```

## Errors

- `400` invalid address or invalid request body.
- `401` missing/invalid bearer token for write endpoints.
- `429` auth rate limit exceeded (nonce/verify endpoints).
- `500` filesystem/read-write failure.

## 5) Read Single Account

Endpoint:

- `GET /api/spCoin/accounts/{accountAddress}`

Behavior:

- Reads `public/assets/accounts/<0XADDRESS>/account.json`.

Example:

```bash
curl -s "http://localhost:3000/api/spCoin/accounts/0x000000000000000000000000000000000000007e"
```

Example response:

```json
{
  "address": "0x000000000000000000000000000000000000007e",
  "data": {
    "address": "0X000000000000000000000000000000000000007e",
    "name": "Agent X"
  }
}
```

## 6) Batch Read Accounts (POST)

Endpoint:

- `POST /api/spCoin/accounts`

Body:

- `{ "addresses": ["0x...", "0X..."] }`

Example:

```bash
curl -X POST "http://localhost:3000/api/spCoin/accounts" \
  -H "Content-Type: application/json" \
  -d "{\"addresses\":[\"0x000000000000000000000000000000000000007e\",\"0x000000000000000000000000000000000000007f\"]}"
```

Example response:

```json
{
  "items": [
    {
      "address": "0x000000000000000000000000000000000000007e",
      "data": {
        "address": "0X000000000000000000000000000000000000007e",
        "name": "Agent X"
      }
    }
  ],
  "countRequested": 2,
  "countValid": 2,
  "countFound": 1,
  "missing": ["0x000000000000000000000000000000000000007f"],
  "invalid": []
}
```

