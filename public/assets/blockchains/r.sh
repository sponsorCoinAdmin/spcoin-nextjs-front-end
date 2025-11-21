# File: scripts/uppercase_child_dirs.sh
#!/usr/bin/env bash
set -euo pipefail

# Make globs that match nothing expand to nothing
shopt -s nullglob

# Loop over every directory matching ./*/* (two levels deep)
for parent in ./*/*/; do
  # Safety: ensure it's a directory
  [ -d "$parent" ] || continue

  # Now loop over each *child directory* inside that parent
  for child in "$parent"*/; do
    [ -d "$child" ] || continue

    base=$(basename "$child")
    upper=${base^^}  # Bash uppercase conversion

    # Skip if already uppercase
    if [[ "$base" == "$upper" ]]; then
      continue
    fi

    src="$child"
    dest="${parent}${upper}"

    # Avoid collisions (e.g. foo/ and FOO/ both existing)
    if [ -e "$dest" ]; then
      echo "Skipping '$src' → '$dest' (target already exists)" >&2
      continue
    fi

    echo "Renaming '$src' → '$dest'"
    mv "$src" "$dest"
  done
done

