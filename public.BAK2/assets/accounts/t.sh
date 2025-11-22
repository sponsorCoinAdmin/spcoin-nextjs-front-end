#!/bin/bash

# Find all wallet.json files in subdirectories of the current directory
find . -type f -path "*/wallet.json" 2>/dev/null | while IFS= read -r file; do
    # Check if the file contains '  "website": ""' before modifying
    if grep -q '  "website": ""' "$file"; then
        # Replace the exact line containing '  "website": ""' with '  "  website": "",'
        sed -i 's/  "website": ""/  "  website": "",/g' "$file"
        echo "Updated: $file"
    fi
done

echo "Replacement completed."


