#!/bin/bash

for dir in */; do
  # Strip trailing slash
  dir=${dir%/}

  # Construct source and destination paths
  src_path="./$dir/info"
  dest_path="./$dir/contracts/0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"

  # Find the avatar file (any extension)
  avatar_file=$(find "$src_path" -maxdepth 1 -type f -name "avatar.*" 2>/dev/null)

  if [[ -n "$avatar_file" ]]; then
    mkdir -p "$dest_path"
    cp "$avatar_file" "$dest_path"
    echo "✅ Copied $(basename "$avatar_file") to $dest_path"
  else
    echo "⚠️  No avatar.* found in $src_path"
  fi
done
