# HTTP Header Tracker

A complete system for collecting, aggregating, and analyzing HTTP header statistics to optimize the [qh:// (Quite OK HTTP) protocol](https://github.com/qh-project/qh) static header table.

- [Chrome web store](https://chromewebstore.google.com/detail/maeojhhhlgnmghchibhmelfjmaopmghm?utm_source=item-share-cb/)
- [Mozilla add-ons](https://addons.mozilla.org/en-US/firefox/addon/http-header-tracker/)

## Components

1. **Browser plugin** (`plugin/`) - Collects header statistics
2. **Node.js/Express Server** (`server/`) - Aggregates data and provides a dashboard UI
3. **Analysis CLI** (`cmd/merge_headers.py`) - Generates .xlsx file for analysis; export to CSV once ready
4. **Build Output CLI** (`cmd/generate_outputs.py`) - Generates Markdown documentation and Go static table definitions from the exported CSV

## Features

- **Data Collection**: Aggregates header name/value pairs with their type (request/response) and frequencies.
- **Configurable Endpoint**: Configure the server endpoint, where the data is sent to.
- **Interactive Analysis Dashboard**: A static html UI (`/dashboard`) to analyze the data
- **Data Export**:
  - Download all statistics in CSV format (`/stats/download`).
  - View all statistics as a sorted JSON array (`/stats`).
- **Persistence**: Statistics are saved to a `stats.json` file on the server to survive restarts.
- **Simple Dashboard**: A basic landing page (`/`) that displays the top 10 most frequent headers.

## Modes

- **Local Mode (Default)**: The collected header data is stored locally in the browser's storage. Data accumulates until manually exported or cleared. No data is transmitted to any server.
- **Server Mode**: The collected header data is sent to a specified server at regular intervals. Some sensitive header values are anonymized before transmission. **Local data is automatically cleared after each successful upload**, so the server becomes the permanent data store.

## Local Installation

### Chrome/Chromium

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked"
5. Select the `plugin` folder from this repository
6. The extension icon should appear in your toolbar

### Firefox

1. Clone or download this repository
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Navigate to the `plugin` folder and select the `manifest.json` file
5. The extension will be loaded temporarily (for permanent installation, you'll need to sign it or use Firefox Developer Edition/Nightly with `xpinstall.signatures.required` set to `false` in `about:config`)

## Server

### Setup

1. Navigate to the `server` directory: `cd server`
2. Install dependencies: `npm install`
3. Start the server: `npm start`

The server will be available at `http://localhost:3000`.

### API Endpoints

- `GET /`: Displays a simple HTML page with the top 10 most frequent headers and links to other views.
- `GET /dashboard`: **Interactive Analysis Dashboard** - Tool for analyzing header data.
- `POST /plugin`: The endpoint for the browser extension to send statistics. Expects a JSON body with a `stats` array.
- `GET /stats`: Returns the full, aggregated statistics as a JSON array, sorted by frequency.
- `GET /stats/download`: Triggers a download of the full statistics as a `header-stats.csv` file.

## Development

### Prerequisites

- Node.js
- npm

### Running in Development

To run the extension in a browser for development:

- `npm start`: Launches the extension in Firefox using web-ext (configured for auto-reload on file changes).

For Chrome, load the `plugin` folder as an unpacked extension as described in the Installation section.

`./package.sh` or `npm run package`: Creates a ZIP file in the `build` directory for distribution.

## Privacy & Data

- See [Privacy Policy](plugin/privacy-policy.md)
