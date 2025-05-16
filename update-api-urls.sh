#!/bin/bash

# Script to update API URLs in frontend components

# Function to update API URLs
update_api_urls() {
    local file=$1

    # Back up the file
    cp "$file" "${file}.bak"

    # Replace localhost:8080 with /api
    sed -i 's|http://localhost:8080|/api|g' "$file"
    sed -i 's|http://10.100.102.111:8080|/api|g' "$file"

    echo "Updated $file"
}

# Update the component files
echo "Updating API URLs in frontend components..."

# Find all files that might contain API URLs
files=$(grep -l "localhost:8080\|10.100.102.111:8080" src/components/*.jsx src/pages/*.astro)

# Update each file
for file in $files; do
    update_api_urls "$file"
done

echo "Done! The following files were updated:"
echo "$files"
echo ""
echo "Backup files have been created with .bak extension."
echo "You can now build and run the Docker containers with:"
echo "./start.sh"