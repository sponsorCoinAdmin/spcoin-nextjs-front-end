# File: scripts/uppercase_0x_dirs_recursive.sh
#!/usr/bin/env bash
set -euo pipefail

# Safety: refuse to run in /
if [[ "$(pwd)" == "/" ]]; then
  echo "Refusing to run in /"
  exit 1
fi

echo "��� Scanning for directories starting with '0x' under: $(pwd)"
echo

# Use -depth so children are processed before parents.
# -print0 avoids issues with spaces and weird characters.
while IFS= read -r -d '' dir; do
  base=$(basename "$dir")

  # Only touch basenames that start with literal "0x"
  case "$base" in
    0x*) ;;
    *) continue ;;
  esac

  upper=${base^^}  # Bash uppercase conversion → 0XABC...

  # Skip if already uppercased
  if [[ "$base" == "$upper" ]]; then
    echo "⏭️  Already uppercase, skipping: $dir"
    continue
  fi

  parent=$(dirname "$dir")
  src="$dir"
  dest="${parent}/${upper}"

  # Collision safety
  if [[ -e "$dest" ]]; then
    echo "⚠️  SKIP: target already exists:"
    echo "    src:  $src"
    echo "    dest: $dest"
    continue
  fi

  echo "↪️  Renaming:"
  echo "    $src"
  echo "    → $dest"
  mv "$src" "$dest"

done < <(find . -depth -type d -name '0x*' -print0)

echo
echo "✅ Done uppercasing 0x* directories."

