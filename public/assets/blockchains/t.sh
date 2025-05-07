#!/bin/bash

for dir in ./*/; do
  info_json="${dir}info/info.json"
  target_json="${dir}contracts/0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE/info.json"

  if [[ -f "$info_json" && -f "$target_json" ]]; then
    # Extract symbol from source
    new_symbol_line=$(grep '"symbol"' "$info_json" | head -1)

    # Replace symbol in target
    tmp_file="${target_json}.tmp"
    awk -v new_symbol="$new_symbol_line" '
      {
        if ($0 ~ /"symbol"/) {
          print new_symbol
        } else {
          print $0
        }
      }
    ' "$target_json" > "$tmp_file" && mv "$tmp_file" "$target_json"

    echo "✔ Updated symbol in: $target_json"
  else
    echo "⚠️ Skipped $dir — required files missing"
  fi
done
