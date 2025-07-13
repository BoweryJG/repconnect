#!/bin/bash

# Update all references from osbackend-zl1h.onrender.com to pedrobackend.onrender.com

echo "Updating backend URLs..."

# Find and replace in all relevant files
find . -type f \( -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.md" -o -name "*.env" \) \
  -not -path "./node_modules/*" \
  -not -path "./.git/*" \
  -not -path "./build/*" \
  -not -path "./dist/*" \
  -exec grep -l "osbackend-zl1h\.onrender\.com" {} \; | while read file; do
    echo "Updating: $file"
    sed -i '' 's/osbackend-zl1h\.onrender\.com/pedrobackend.onrender.com/g' "$file"
done

echo "Done! All backend URLs have been updated."