#!/bin/bash

echo "��� Searching for files nlogo.pngar.png'..."

find . -type f -name 'logo.png' | while read -r file; do
  dir=$(dirname "$file")
  new="$dir/logo.png"
  echo "Renaming: $file → $new"
  mv "$file" "$new"
done

