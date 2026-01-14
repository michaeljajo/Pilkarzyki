#!/bin/bash

# Remove console.log statements from TypeScript files
# Keeps console.error, console.warn, console.info

echo "Removing console.log statements from API routes and dashboard pages..."

# Find all .ts and .tsx files in src/app
find src/app -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' '/^[[:space:]]*console\.log(/d' {} \;

echo "Done! console.log statements removed."
echo "console.error and console.warn statements preserved for error handling."
