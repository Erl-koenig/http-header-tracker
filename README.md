# HTTP Header Tracker

This chrome extension is designed to collect and analyze data on the most frequently used HTTP headers across the web. The primary goal of this data collection is to inform and optimize the header design for the [qh:// (Quite OK HTTP) protocol](https://github.com/qh-project/qh).

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

## Privacy & Data

See the [Privacy Policy](plugin/privacy-policy.md) for detailed information about:

- What data is collected
- How sensitive data is protected
- How you can control your data
- Where data is stored

## Server Setup

## API Endpoints

- `GET /`: Displays an HTML dashboard with the top 10 most frequent headers and a download link.
- `POST /plugin`: The endpoint for the browser extension to send statistics. Expects a JSON body with a `stats` array.
- `GET /stats`: Returns the full, aggregated statistics as a JSON object, sorted by frequency.
- `GET /stats/download`: Triggers a download of the full statistics as a `header-stats.csv` file.

## License
