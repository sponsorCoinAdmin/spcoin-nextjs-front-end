#!/bin/bash

for dir in */; do
  dir="${dir%/}"

  src_info="./$dir/info/info.json"
  dest_dir="./$dir/contracts/0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
  dest_info="$dest_dir/info.json"
  backup_info="$dest_info.bak"

  if [[ -f "$src_info" && -f "$dest_info" ]]; then
    cp "$dest_info" "$backup_info"
    echo "📦 Backup created: $backup_info"

    node merge-json.js "$dest_info" "$src_info"
  else
    echo "⚠️  Skipping $dir — missing info.json"
  fi
done
