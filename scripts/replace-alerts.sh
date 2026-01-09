#!/bin/bash

# File: scripts/replace-alerts.sh

ROOT_DIR="."
IMPORT_LINE="import { JUNK_ALERTS } from '@/lib/utils/JUNK_ALERTS';"
EXCLUDED_DIRS=("node_modules" ".next" ".git" ".turbo" "out")

should_exclude() {
  for dir in "${EXCLUDED_DIRS[@]}"; do
    if [[ "$1" == *"/$dir/"* ]]; then
      return 0
    fi
  done
  return 1
}

find "$ROOT_DIR" \( -name "*.ts" -o -name "*.tsx" \) | while read -r file; do
  if should_exclude "$file"; then
    continue
  fi

  if grep -q 'alert(' "$file"; then
    echo "í´§ Updating: $file"

    # Only add import if not already there
    if ! grep -q 'JUNK_ALERTS' "$file"; then
      # Add import line after the last import
      awk -v import="$IMPORT_LINE" '
        BEGIN { inserted=0 }
        /^import / { print; last_import=NR; next }
        {
          if (!inserted && NR > last_import) {
            print import;
            inserted=1;
          }
          print;
        }
      ' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
    fi

    # Replace all alert( with JUNK_ALERTS(
    sed -i 's/\<alert\s*(/JUNK_ALERTS(/g' "$file"
  fi
done

