#!/bin/bash
# Package the extension for Chrome Web Store and Firefox Add-ons submission

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Packaging HTTP Header Tracker extension...${NC}"
echo -e "${BLUE}Working directory: ${SCRIPT_DIR}${NC}"

# Extract version from manifest.json
VERSION=$(grep -o '"version":\s*"[^"]*"' manifest.json | grep -o '[0-9.]*')
echo -e "${BLUE}Version: ${YELLOW}${VERSION}${NC}"

# Clean up any existing build artifacts
rm -rf dist
rm -rf build

mkdir -p dist
mkdir -p build

echo -e "${BLUE}Copying extension files...${NC}"

cp manifest.json dist/
cp browser-polyfill.js dist/
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

FILENAME="http-header-tracker-v${VERSION}.zip"

cd dist
zip -r "../build/${FILENAME}" . > /dev/null
cd ..

# Clean up dist directory
rm -rf dist

echo -e "${GREEN}✓ Package created: ${BLUE}build/${FILENAME}${NC}"
