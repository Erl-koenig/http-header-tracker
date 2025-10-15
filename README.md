# HTTP Header Tracker

This project is designed to collect and analyze data on the most frequently used HTTP headers across the web. The primary goal of this data collection is to inform and optimize the header design for the `qh://` (Quite OK HTTP) protocol.

Project `qh`: https://github.com/qh-project/qh

## How It Works

The system consists of two main components:

1.  **Browser Extension**: A browser extension (designed for Chrome) that observes HTTP headers from web traffic and periodically sends aggregated, anonymized statistics to the server.
2.  **Server**: A Node.js/Express server that receives data from the extensions, aggregates it, and persists it. It also provides a simple web interface and API to view and download the collected statistics.

## Features

- **Data Collection**: Aggregates header name/value pairs and their frequencies.
- **Web Dashboard**: A simple landing page (`/`) that displays the top 10 most frequent headers.
- **Data Export**:
  - Download all statistics in CSV format (`/stats/download`).
  - View all statistics as a sorted JSON array (`/stats`).
- **Persistence**: Statistics are saved to a `stats.json` file on the server to survive restarts.

## API Endpoints

- `GET /`: Displays an HTML dashboard with the top 10 most frequent headers and a download link.
- `POST /plugin`: The endpoint for the browser extension to send statistics. Expects a JSON body with a `stats` array.
- `GET /stats`: Returns the full, aggregated statistics as a JSON object, sorted by frequency.
- `GET /stats/download`: Triggers a download of the full statistics as a `header-stats.csv` file.
