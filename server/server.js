const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const PORT = 3000;
const DATA_FILE_PATH = path.join(__dirname, "stats.json");

// Use `let` as this object will be replaced when loading from file.
let aggregatedStats = {};

// === Data Persistence Functions ===

const loadData = async () => {
  try {
    // Check if the file exists before trying to read it.
    await fs.access(DATA_FILE_PATH);
    const data = await fs.readFile(DATA_FILE_PATH, "utf-8");
    aggregatedStats = JSON.parse(data);
    console.log("Successfully loaded stats from stats.json");
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log("stats.json not found. Starting with empty stats.");
      aggregatedStats = {};
    } else {
      console.error("Error loading data from stats.json:", error);
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
app.use(express.json({ limit: "5mb" }));

// A simple logging middleware to see incoming requests.
app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] Received ${req.method} request for ${
      req.url
    }`,
  );
  next();
});

// === Routes ===

/**
 * Dashboard endpoint - Interactive analysis dashboard
 */
app.get("/dashboard", async (req, res) => {
  try {
    const dashboardPath = path.join(__dirname, "dashboard.html");
    res.sendFile(dashboardPath);
  } catch (error) {
    console.error("Error serving dashboard:", error);
    res.status(500).send("Error loading dashboard");
  }
});

/**
 * Default endpoint to display a simple HTML page with top stats.
 */
app.get("/", (req, res) => {
  // Get stats, sort by count, and take the top 10.
  const sortedStats = Object.values(aggregatedStats).sort(
    (a, b) => b.count - a.count,
  );
  const topTen = sortedStats.slice(0, 10);

  // Helper to escape HTML entities
  const escapeHtml = (unsafe) => {
    if (unsafe === null || typeof unsafe === "undefined") return "";
    return unsafe
      .toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // Generate the HTML content
  const tableRows = topTen
    .map(
      (stat) => `
    <tr>
      <td>${escapeHtml(stat.type)}</td>
      <td>${escapeHtml(stat.name)}</td>
      <td>${escapeHtml(stat.value)}</td>
      <td>${stat.count}</td>
    </tr>`,
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>HTTP Header Stats</title>
      <style>body{font-family:sans-serif;margin:2em;background-color:#f4f4f9;color:#333}h1,h2{color:#444}a{color:#007bff;text-decoration:none}a:hover{text-decoration:underline}table{border-collapse:collapse;width:80%;margin-top:20px;box-shadow:0 2px 3px rgba(0,0,0,.1)}th,td{padding:12px 15px;text-align:left;border-bottom:1px solid #ddd}th{background-color:#007bff;color:#fff}tr:nth-child(even){background-color:#f2f2f2}tr:hover{background-color:#e9e9e9}.download-link{margin-top:20px;display:inline-block;padding:10px 20px;background-color:#28a745;color:#fff;border-radius:5px}</style>
    </head>
    <body>
      <h1>HTTP Header Statistics</h1>
      <h2>Top 10 Most Frequent Headers</h2>
      ${
        topTen.length > 0
          ? `<table><thead><tr><th>Type</th><th>Header Name</th><th>Header Value</th><th>Count</th></tr></thead><tbody>${tableRows}</tbody></table>`
          : "<p>No statistics have been collected yet.</p>"
      }
      <a href="/dashboard" class="download-link">Open Analysis Dashboard</a>
      <a href="/stats" class="download-link">View Raw Data</a>
      <a href="/stats/download" class="download-link">Download Raw Data (CSV)</a>
    </body>
    </html>
  `;

  res.status(200).send(html);
});

/**
 * Endpoint to receive header statistics from the Chrome extension.
 * It expects a POST request with a JSON body.
 */
app.post("/plugin", async (req, res) => {
  const incomingStats = req.body.stats;

  if (!incomingStats || !Array.isArray(incomingStats)) {
    return res.status(400).json({
      error: 'Invalid payload. "stats" array is missing or not an array.',
    });
  }

  console.log(`Processing ${incomingStats.length} stat entries...`);

  // Iterate over the incoming stats and update our master list.
  incomingStats.forEach((stat) => {
    const type = stat.type;
    const key = `${type}::${stat.name.toLowerCase()}::${stat.value || ""}`;
    if (aggregatedStats[key]) {
      // If the header/value pair already exists, add the new count.
      aggregatedStats[key].count += stat.count;
    } else {
      // Otherwise, add it as a new entry.
      aggregatedStats[key] = {
        name: stat.name,
        value: stat.value,
        type: type,
        count: stat.count,
      };
    }
  });

  try {
    await saveData();
    console.log("Successfully updated and saved aggregated stats.");
  } catch (error) {
    console.error("Failed to save data to file:", error);
    return res
      .status(500)
      .json({ message: "Data processed but failed to save." });
  }
  console.log("Successfully updated aggregated stats.");
  res
    .status(200)
    .json({ message: "Data received and processed successfully." });
});

/**
 * Endpoint to view the current aggregated statistics.
 */
app.get("/stats", (req, res) => {
  // Convert stats object to an array and sort it by count in descending order.
  const sortedStats = Object.values(aggregatedStats).sort(
    (a, b) => b.count - a.count,
  );
  res.status(200).json(sortedStats);
});

/**
 * Endpoint to download the current aggregated statistics as a CSV file.
 */
app.get("/stats/download", (req, res) => {
  const sortedStats = Object.values(aggregatedStats).sort(
    (a, b) => b.count - a.count,
  );

  // Convert to CSV
  const csvHeader = ["Type", "Header Name", "Header Value", "Count"].join(",");
  const csvRows = sortedStats.map((stat) => {
    const type = `"${stat.type.replace(/"/g, '""')}"`;
    const name = `"${stat.name.replace(/"/g, '""')}"`;
    const value = `"${(stat.value || "").replace(/"/g, '""')}"`;
    return [type, name, value, stat.count].join(",");
  });

  const csvContent = [csvHeader, ...csvRows].join("\n");

  // Set headers to trigger download
  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="header-stats.csv"',
  );
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
