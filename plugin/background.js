importScripts("anonymization.js");

const UPLOAD_ALARM_NAME = "uploadHeadersAlarm";

let pendingStats = {};

// Flush pending stats to persistent storage
async function flushPendingStats() {
  if (Object.keys(pendingStats).length === 0) {
    return;
  }

  const data = await chrome.storage.local.get("aggregatedStats");
  const aggregatedStats = data.aggregatedStats || {};

  for (const key in pendingStats) {
    if (aggregatedStats[key]) {
      aggregatedStats[key].count += pendingStats[key].count;
    } else {
      aggregatedStats[key] = pendingStats[key];
    }
  }

  await chrome.storage.local.set({ aggregatedStats });

  console.log(
    `Flushed ${Object.keys(pendingStats).length} pending stats to storage.`,
  );

  pendingStats = {};
}

function updateUploadAlarm() {
  chrome.storage.sync.get(["uploadFrequency"], (result) => {
    const frequency = result.uploadFrequency || 5;
    chrome.alarms.clear(UPLOAD_ALARM_NAME);
    chrome.alarms.create(UPLOAD_ALARM_NAME, { periodInMinutes: frequency });
    console.log(`Upload alarm set to every ${frequency} minutes.`);
  });
}

// Start capturing headers immediately on service worker startup
chrome.webRequest.onHeadersReceived.addListener(
  createHeaderListener("response"),
  { urls: ["<all_urls>"] },
  ["responseHeaders"],
);

chrome.webRequest.onBeforeSendHeaders.addListener(
  createHeaderListener("request"),
  { urls: ["<all_urls>"] },
  ["requestHeaders"],
);

console.log(
  "Header capture enabled for both requests and responses (local + optional server mode).",
);

// Listen for when the extension is first installed
chrome.runtime.onInstalled.addListener(() => {
  // Initialize storage with empty aggregated stats
  chrome.storage.local.set({ aggregatedStats: {} });
  // Set up the upload alarm with default or saved frequency
  updateUploadAlarm();
  console.log("Header Exporter extension installed.");
});

// Function to create the header listener
function createHeaderListener(type) {
  return (details) => {
    const headers =
      type === "request" ? details.requestHeaders : details.responseHeaders;

    if (!headers) return;

    // Aggregate into in-memory buffer (batching, no storage writes)
    headers.forEach((header) => {
      const headerName = header.name.toLowerCase();
      let headerValue = header.value || "";

      if (shouldAnonymizeHeader(headerName, headerValue, type)) {
        headerValue = "(anonymized)";
      }

      const key = `${type}::${headerName}::${headerValue}`;
      if (pendingStats[key]) {
        pendingStats[key].count++;
      } else {
        pendingStats[key] = {
          name: header.name,
          value: headerValue,
          type: type,
          count: 1,
        };
      }
    });
  };
}

// Listen for changes to storage
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "sync") {
    if (changes.uploadFrequency) {
      console.log("Upload frequency changed, updating alarm.");
      updateUploadAlarm();
    }
  }
});

// Listen for the alarm to flush stats and optionally upload to server
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === UPLOAD_ALARM_NAME) {
    console.log("Alarm triggered: Flushing pending stats.");

    // Always flush pending stats to storage (for both local and server mode)
    await flushPendingStats();

    // Check if server endpoint is configured
    chrome.storage.sync.get(["serverEndpoint"], async (result) => {
      const serverEndpoint = result.serverEndpoint;

      if (!serverEndpoint || serverEndpoint.trim() === "") {
        console.log("Local-only mode: Stats flushed to storage.");
        return;
      }

      // Server mode: Upload current aggregated stats
      const data = await chrome.storage.local.get("aggregatedStats");
      const aggregatedStats = data.aggregatedStats || {};

      if (Object.keys(aggregatedStats).length === 0) {
        console.log("No stats to upload yet.");
        return;
      }

      const payload = {
        timestamp: new Date().toISOString(),
        stats: Object.values(aggregatedStats),
      };

      try {
        const response = await fetch(serverEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          console.log(
            `Successfully uploaded ${
              Object.keys(aggregatedStats).length
            } stats to ${serverEndpoint}.`,
          );
          await chrome.storage.local.set({ aggregatedStats: {} });
          console.log("Cleared local stats after successful upload to server.");
        } else {
          console.error(`Server responded with status: ${response.status}`);
        }
      } catch (error) {
        console.error("Failed to upload stats:", error);
      }
    });
  }
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "exportStats") {
    // Flush pending stats before exporting
    (async () => {
      await flushPendingStats();

      const data = await chrome.storage.local.get(["aggregatedStats"]);
      const aggregatedStats = data.aggregatedStats || {};
      const statsArray = Object.values(aggregatedStats).sort(
        (a, b) => b.count - a.count,
      );

      sendResponse({
        status: "success",
        stats: statsArray,
        totalEntries: statsArray.length,
      });
    })();
    return true;
  }

  if (request.action === "getStats") {
    // Also flush for getStats to show accurate count
    (async () => {
      await flushPendingStats();

      const data = await chrome.storage.local.get(["aggregatedStats"]);
      const stats = data.aggregatedStats || {};
      const totalEntries = Object.keys(stats).length;

      sendResponse({
        status: "success",
        totalEntries: totalEntries,
      });
    })();
    return true;
  }

  if (request.action === "clearAll") {
    pendingStats = {};
    // Clear persistent storage
    chrome.storage.local.set({ aggregatedStats: {} }, () => {
      console.log("All header data cleared (pending and stored).");
      sendResponse({ success: true });
    });

    return true;
  }
});
