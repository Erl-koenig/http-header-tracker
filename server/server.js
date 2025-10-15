const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE_PATH = path.join(__dirname, 'stats.json');

// Use `let` as this object will be replaced when loading from file.
let aggregatedStats = {};

// === Data Persistence Functions ===

const loadData = async () => {
  try {
    // Check if the file exists before trying to read it.
    await fs.access(DATA_FILE_PATH);
    const data = await fs.readFile(DATA_FILE_PATH, 'utf-8');
    aggregatedStats = JSON.parse(data);
    console.log('Successfully loaded stats from stats.json');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('stats.json not found. Starting with empty stats.');
      aggregatedStats = {};
    } else {
      console.error('Error loading data from stats.json:', error);
    }
  }
};

const saveData = async () => {
  // Write the in-memory stats object to the JSON file.
  await fs.writeFile(DATA_FILE_PATH, JSON.stringify(aggregatedStats, null, 2));
};

// === Middleware ===
// Enable CORS to allow requests from the Chrome extension's origin.
app.use(cors());
// Enable parsing of JSON request bodies.
app.use(express.json());

// A simple logging middleware to see incoming requests.
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Received ${req.method} request for ${req.url}`);
  next();
});


// === Routes ===

/**
 * Endpoint to receive header statistics from the Chrome extension.
 * It expects a POST request with a JSON body.
 */
app.post('/plugin', async (req, res) => {
  const incomingStats = req.body.stats;

  if (!incomingStats || !Array.isArray(incomingStats)) {
    return res.status(400).json({ error: 'Invalid payload. "stats" array is missing or not an array.' });
  }

  console.log(`Processing ${incomingStats.length} stat entries...`);

  // Iterate over the incoming stats and update our master list.
  incomingStats.forEach(stat => {
    const key = `${stat.name.toLowerCase()}::${stat.value || ''}`;
    if (aggregatedStats[key]) {
      // If the header/value pair already exists, add the new count.
      aggregatedStats[key].count += stat.count;
    } else {
      // Otherwise, add it as a new entry.
      aggregatedStats[key] = { name: stat.name, value: stat.value, count: stat.count };
    }
  });

  try {
    await saveData();
    console.log('Successfully updated and saved aggregated stats.');
  } catch (error) {
    console.error('Failed to save data to file:', error);
    return res.status(500).json({ message: 'Data processed but failed to save.' });
  }
  console.log('Successfully updated aggregated stats.');
  res.status(200).json({ message: 'Data received and processed successfully.' });
});

/**
 * Endpoint to view the current aggregated statistics.
 */
app.get('/stats', (req, res) => {
  // Convert stats object to an array and sort it by count in descending order.
  const sortedStats = Object.values(aggregatedStats)
    .sort((a, b) => b.count - a.count);
  res.status(200).json(sortedStats);
});

/**
 * Endpoint to download the current aggregated statistics as a CSV file.
 */
app.get('/stats/download', (req, res) => {
  const sortedStats = Object.values(aggregatedStats)
    .sort((a, b) => b.count - a.count);

  // Convert to CSV
  const csvHeader = ['Header Name', 'Header Value', 'Count'].join(',');
  const csvRows = sortedStats.map(stat => {
    const name = `"${stat.name.replace(/"/g, '""')}"`;
    const value = `"${(stat.value || '').replace(/"/g, '""')}"`;
    return [name, value, stat.count].join(',');
  });

  const csvContent = [csvHeader, ...csvRows].join('\n');

  // Set headers to trigger download
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="header-stats.csv"');
  res.status(200).send(csvContent);
});


// Start the server after loading initial data.
const startServer = async () => {
  await loadData();
  app.listen(PORT, () => {
    console.log(`Header stats server listening on http://localhost:${PORT}`);
  });
};

startServer();