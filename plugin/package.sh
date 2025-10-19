#!/bin/bash
# Package the Chrome extension for Chrome Web Store submission

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Packaging HTTP Header Tracker extension...${NC}"
echo -e "${BLUE}Working directory: ${SCRIPT_DIR}${NC}"

# Clean up any existing build artifacts
rm -rf dist
rm -f http-header-tracker.zip

mkdir -p dist

echo -e "${BLUE}Copying extension files...${NC}"

cp manifest.json dist/
cp background.js dist/
cp anonymization.js dist/
cp popup.html dist/
cp popup.js dist/
cp popup.css dist/
cp settings.html dist/
cp settings.js dist/
cp settings.css dist/
cp privacy-policy.md dist/
cp -r icons dist/

echo -e "${BLUE}Creating zip archive...${NC}"

cd dist
zip -r ../http-header-tracker.zip .
cd ..

# Clean up dist directory
rm -rf dist

echo -e "${GREEN}Done!${NC}"
