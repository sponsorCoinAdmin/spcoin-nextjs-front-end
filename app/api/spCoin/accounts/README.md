<!-- File: app/api/spCoin/accounts/README.md -->
# SponsorCoin Accounts API Usage

This folder contains two account APIs:

- `GET /api/spCoin/accounts`
- `PUT|POST /api/spCoin/accounts/{accountAddress}`

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
  -H "Content-Type: image/png" \
  --data-binary "@./logo.png"
```

Multipart example:

```bash
curl -X PUT "http://localhost:3000/api/spCoin/accounts/0x000000000000000000000000000000000000007e?target=logo" \
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
- `500` filesystem/read-write failure.

