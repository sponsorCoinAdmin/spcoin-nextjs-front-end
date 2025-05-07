#!/bin/bash

for dir in ./*/; do
  target="$dir/contracts/0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE/info.json"
  backup="$dir/contracts/0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE/info.json.bak"

  if [[ -f "$target" && -f "$backup" ]]; then
    # Extract "name" line from .bak
    nameLine=$(grep '"name":' "$backup")

    if [[ -n "$nameLine" ]]; then
      # Replace "name" line in target with the one from backup
      tmpFile=$(mktemp)
      sed "s/.*\"name\":.*/$nameLine/" "$target" > "$tmpFile" && mv "$tmpFile" "$target"
      echo "🔁 Updated 'name' in: $target"
    else
      echo "⚠️  No 'name' line found in: $backup"
    fi
  else
    echo "❌ Missing file in: $dir"
  fi
done
