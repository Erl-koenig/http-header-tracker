# Privacy Policy - HTTP Header Tracker

**Last Updated:** October 19, 2025

## Summary

HTTP Header Tracker does not collect, store, or transmit any personal data. All analysis happens locally on your device. You have full control over all data collected by this extension.

## Overview

HTTP Header Tracker is a Chrome browser extension designed to process and analyze statistics about HTTP request and response headers across the web. **By default, all data stays on your device** - the extension developer receives no data from you.

This privacy policy explains what data is processed, how we protect your privacy, and how you maintain full control over your data.

## What Data Is Processed

**Important:** By default, the extension developer receives NO DATA from you. All data stays on your device.

### HTTP Request and Response Headers

The extension monitors and processes HTTP headers from websites you visit:

- **Header names** (e.g., "accept", "content-type", "cache-control")
- **Header values** (e.g., "application/json", "max-age=3600")
- **Header type** (request or response)
- **Frequency counts** of how often each header name/value/type combination appears

Both **request headers** (sent from your browser to websites) and **response headers** (sent from websites to your browser) are tracked to provide comprehensive HTTP header usage statistics.

This data is stored **locally in your browser** and never leaves your device unless you explicitly configure server mode (see below).

### What Is NOT Processed

- Full URLs of websites you visit
- Page content or HTML
- Request or response bodies
- Personally identifiable information (PII): sensitive headers are anonymized as described below

## Data Protection & Anonymization

The extension includes **automatic anonymization** of some sensitive data:

### Always Anonymized Headers

The following headers are **always anonymized** and their values are replaced with "(anonymized)":

- Authentication headers: `authorization`, `proxy-authorization`, `www-authenticate`, `proxy-authenticate`
- Cookie headers: `cookie`, `set-cookie`
- Security tokens: `x-csrf-token`, `csrf-token`, `x-api-key`, `api-key`
- Privacy-sensitive headers: `host`, `referer`, `origin`, `user-agent`
- IP address headers: `x-forwarded-for`, `x-real-ip`, `x-client-ip`, `cf-connecting-ip`, `true-client-ip`
- Session identifiers and custom tokens

### Automatic Pattern Detection

Header values are automatically anonymized if they appear to contain:

- JWT tokens (JSON Web Tokens)
- Bearer tokens
- UUIDs (Universally Unique Identifiers)
- Long hexadecimal strings (32-64 characters)
- Long base64-encoded strings (>40 characters)
- Any value longer than 2000 characters

### Header Name Analysis

Headers are anonymized if their names contain keywords suggesting sensitive data:

- "token", "secret", "key", "auth", "session", "password", "credential", "private"

## Data Storage & Transmission

The extension operates in two modes, which you can configure:

### Local Mode (Default)

- All data is stored **only** in your browser's local storage
- **No data is transmitted to any external server**
- **The extension developer receives NO DATA**
- Data accumulates until you manually export or clear it
- Data remains on your device and under your complete control

**Storage Security:**

- Data in browser storage is **not encrypted** and is stored as plain text on your device's file system
- Other browser extensions **cannot access** this data (Chrome isolates extension storage by design)
- Someone with file system access could potentially read the stored data

### Server Mode (Optional)

- You can optionally configure **your own** server endpoint in settings
- Aggregated, anonymized statistics are periodically sent to **your configured server**
- Upload frequency is configurable (default: every 5 minutes)
- **Local data is automatically cleared after each successful upload**
- Your server becomes the permanent data store
- **Important:** The extension developer does NOT operate or control any server. Data is only sent to the server endpoint YOU configure. While sensitive headers are anonymized, there is no guarantee that all potentially sensitive data is filtered. Use server mode only if you trust the configured endpoint.

## Permissions Explained

The extension requires the following Chrome permissions:

- **`webRequest`**: Required to observe HTTP request and response headers from web traffic
- **`storage`**: Used to store aggregated statistics locally in your browser
- **`unlimitedStorage`**: Allows storing large amounts of data in local-only mode without hitting browser storage limits
- **`downloads`**: Allows you to export collected statistics as JSON files
- **`alarms`**: Enables periodic flushing of statistics to storage and optional server uploads
- **`host_permissions: <all_urls>`**: Necessary to monitor headers from all websites you visit (the extension cannot selectively monitor specific sites)

## Your Control & Data Rights

You have full control over your data:

### View Your Data

- Click the extension icon to view statistics about collected headers
- See total number of unique header name/value pairs collected

### Export Your Data

- Export all collected statistics in JSON format via the extension popup

### Delete Your Data

- Use the "Clear All Data" button in the settings page to permanently delete collected statistics
- This clears both in-memory and persistent storage

### Configure Collection

- **Upload frequency**: Adjust how often data is synced to storage (and uploaded if server mode is enabled)
- **Server endpoint**: Configure where data is sent, or leave blank for local-only mode
- **Test connection**: Verify server connectivity before enabling server mode

## Data Retention

- **Local storage**: Data persists in your browser until you manually clear it or uninstall the extension
- **Server storage**: If you use server mode, retention depends on the server you configure (not controlled by this extension)

## Third-Party Services

- **Local mode**: The extension makes no connections to external services
- **Server mode**: Data is only sent to the server endpoint you explicitly configure
- We do not use third-party analytics, tracking, or advertising services

## Changes to This Policy

We may update this privacy policy to reflect changes to our practices or for legal/regulatory reasons. The "Last Updated" date at the top will be revised accordingly. We encourage you to review this policy periodically.

## Contact & Questions

If you have questions about this privacy policy or data practices, please:

- Open an issue on the GitHub repository

## Consent

By installing and using the HTTP Header Tracker extension, you consent to the data collection and practices described in this privacy policy. You can withdraw consent at any time by uninstalling the extension.
