#!/bin/bash

for dir in */; do
  chainId="${dir%/}"
  nativeInfoPath="./$chainId/contracts/0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE/info.json"
  wrappedInfoPath=$(find "./$chainId/contracts" -mindepth 2 -maxdepth 2 -name "info.json" ! -path "*/0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE/*" | head -n 1)

  if [[ -f "$nativeInfoPath" && -f "$wrappedInfoPath" ]]; then
    jq -s '.[0] * {
      name: .[1].name,
      symbol: .[1].symbol,
      website: .[1].website,
      description: .[1].description,
      explorer: .[1].explorer,
      status: .[1].status,
      id: .[1].id,
      tags: .[1].tags,
      links: .[1].links
    }' "$nativeInfoPath" "$wrappedInfoPath" > "${nativeInfoPath}.merged" && mv "${nativeInfoPath}.merged" "$nativeInfoPath"

    echo "✅ Merged info.json for chain $chainId"
  else
    echo "⚠️  Skipped $chainId — missing required files"
  fi
done
