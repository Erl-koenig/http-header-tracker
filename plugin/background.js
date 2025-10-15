const UPLOAD_ALARM_NAME = "uploadHeadersAlarm";
const SERVER_ENDPOINT = "https://headers.gianhunold.ch/plugin";

// Listen for when the extension is first installed
chrome.runtime.onInstalled.addListener(() => {
  // Initialize storage with an empty array
  chrome.storage.local.set({ capturedRequests: [] });
  // Create an alarm to trigger the upload process every minute
  chrome.alarms.create(UPLOAD_ALARM_NAME, { periodInMinutes: 1 });
  console.log("Header Exporter extension installed.");
});

// Listener for network request headers
chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    chrome.storage.local.get("capturedRequests", (data) => {
      const capturedRequests = data.capturedRequests || [];

      const requestInfo = {
        headers: details.responseHeaders,
      };

      capturedRequests.push(requestInfo);
      chrome.storage.local.set({ capturedRequests });
    });
  },
  // Filter for URLs
  { urls: ["<all_urls>"] },
  // We need responseHeaders to access them
  ["responseHeaders"]
);

// Listen for the alarm to trigger the upload
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === UPLOAD_ALARM_NAME) {
    console.log("Alarm triggered: Reading data for upload.");
    const data = await chrome.storage.local.get("capturedRequests");
    const requests = data.capturedRequests;

    if (!requests || requests.length === 0) {
      console.log("No new headers to upload.");
      return;
    }

    // Immediately clear the storage so new requests don't interfere.
    // We have the data we need in the `requests` variable.
    await chrome.storage.local.set({ capturedRequests: [] });

    // Aggregate the data
    const headerStats = {};
    requests.forEach((request) => {
      request.headers.forEach((header) => {
        const key = `${header.name.toLowerCase()}::${header.value || ""}`;
        if (headerStats[key]) {
          headerStats[key].count++;
        } else {
          headerStats[key] = {
            name: header.name,
            value: header.value || "",
            count: 1,
          };
        }
      });
    });

    const payload = {
      timestamp: new Date().toISOString(),
      stats: Object.values(headerStats),
    };

    // Upload to the server
    try {
      const response = await fetch(SERVER_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log(`Successfully uploaded ${requests.length} header sets.`);
        // The cache has already been cleared.
      } else {
        console.error(`Server responded with status: ${response.status}`);
      }
    } catch (error) {
      console.error("Failed to upload header stats:", error);
    }
  }
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "clear") {
    chrome.storage.local.set({ capturedRequests: [] }, () => {
      console.log("Cleared captured requests.");
      sendResponse({ status: "success" });
    });
    // Return true to indicate you will send a response asynchronously
    return true;
  }
});
