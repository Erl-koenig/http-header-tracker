# HTTP Header Tracker

This chrome extension is designed to collect and analyze data on the most frequently used HTTP headers across the web. The motivation for creating this extension is to use the collected data to refine the header structure of the [qh:// (Quite OK HTTP) protocol](https://github.com/qh-project/qh).

## How It Works

The system consists of two main components:

1.  **Browser Extension**: A browser extension (designed for Chrome) that observes HTTP request and response headers from web traffic and periodically sends aggregated, anonymized statistics to the server (optional).
2.  **Server**: A Node.js/Express server that receives data from the extensions, aggregates it, and persists it. It also provides a simple web interface and API to view and download the collected statistics.

## Features

- **Data Collection**: Aggregates header name/value pairs with their type (request/response) and frequencies.
- **Configurable Endpoint**: Configure the serverendpoint, where the data is sent to.
- **Web Dashboard**: A simple landing page (`/`) that displays the top 10 most frequent headers.
- **Data Export**:
  - Download all statistics in CSV format (`/stats/download`).
  - View all statistics as a sorted JSON array (`/stats`).
- **Persistence**: Statistics are saved to a `stats.json` file on the server to survive restarts.

## Modes

- **Local Mode (Default)**: The collected header data is stored locally in the browser's storage. Data accumulates until manually exported or cleared. No data is transmitted to any server.
- **Server Mode**: The collected header data is sent to a specified server at regular intervals. Some sensitive header values are anonymized before transmission. **Local data is automatically cleared after each successful upload**, so the server becomes the permanent data store.

## Installation

### Official Releases

- [Chrome web store](https://chromewebstore.google.com/detail/maeojhhhlgnmghchibhmelfjmaopmghm?utm_source=item-share-cb)
- [Mozilla add-ons](https://addons.mozilla.org/en-US/firefox/addon/http-header-tracker/)

### Local Development

#### Chrome/Chromium

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked"
5. Select the `plugin` folder from this repository
6. The extension icon should appear in your toolbar

#### Firefox

- Locally:

1. Clone or download this repository
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Navigate to the `plugin` folder and select the `manifest.json` file
5. The extension will be loaded temporarily (for permanent installation, you'll need to sign it or use Firefox Developer Edition/Nightly with `xpinstall.signatures.required` set to `false` in `about:config`)

## Privacy & Data

See the [Privacy Policy](plugin/privacy-policy.md) for detailed information about:

- What data is collected
- How sensitive data is protected
- How you can control your data
- Where data is stored

## Server

### Setup

1. Navigate to the `server` directory: `cd server`
2. Install dependencies: `npm install`
3. Start the server: `npm start`

The server will be available at `http://localhost:3000`.

### API Endpoints

- `GET /`: Displays an HTML dashboard with the top 10 most frequent headers and a download link.
- `POST /plugin`: The endpoint for the browser extension to send statistics. Expects a JSON body with a `stats` array.
- `GET /stats`: Returns the full, aggregated statistics as a JSON object, sorted by frequency.
- `GET /stats/download`: Triggers a download of the full statistics as a `header-stats.csv` file.

## Development

### Prerequisites

- Node.js
- npm

### Running in Development

To run the extension in a browser for development:

- `npm start`: Launches the extension in Firefox using web-ext (configured for auto-reload on file changes).

For Chrome, load the `plugin` folder as an unpacked extension as described in the Installation section.

### Scripts

- `npm test`: Run the test suite using Jest.
- `npm run test:watch`: Run tests in watch mode.
- `npm run test:coverage`: Run tests with coverage reporting.
- `npm run lint`: Lint the extension code using web-ext.
- `./package.sh` or `npm run package`: Creates a ZIP file in the `build` directory for distribution.
