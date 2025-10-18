const UPLOAD_ALARM_NAME = "uploadHeadersAlarm";
const DEFAULT_SERVER_ENDPOINT = "";

// A set of headers whose values should not be stored.
const HEADERS_TO_ANONYMIZE = new Set([
  "x-csrf-token",
  "cart-token",
  "x-conduit-token",
  "x-conduit-tokens",
  "x-conduit-worker",
  "x-netflix.request.growth.session.id",
]);

// Track whether we should be capturing headers
let isCapturing = false;
let headerListener = null;

// Listen for when the extension is first installed
chrome.runtime.onInstalled.addListener(() => {
  // Initialize storage with an empty array
  chrome.storage.local.set({ capturedRequests: [] });
  // Create an alarm to trigger the upload process every 5 minutes
  chrome.alarms.create(UPLOAD_ALARM_NAME, { periodInMinutes: 5 });
  console.log("Header Exporter extension installed.");
  // Check if we should start capturing
  updateCaptureState();
});

// Function to create the header listener
function createHeaderListener() {
  return (details) => {
    chrome.storage.local.get("capturedRequests", (data) => {
      const capturedRequests = data.capturedRequests || [];

      const requestInfo = {
        headers: details.responseHeaders,
      };

      capturedRequests.push(requestInfo);
      chrome.storage.local.set({ capturedRequests });
    });
  };
}

// Function to update capture state based on endpoint configuration
function updateCaptureState() {
  chrome.storage.sync.get(["serverEndpoint"], (result) => {
    const endpoint = result.serverEndpoint || "";
    const shouldCapture = endpoint && endpoint.trim() !== "";

    if (shouldCapture && !isCapturing) {
      // Start capturing
      headerListener = createHeaderListener();
      chrome.webRequest.onHeadersReceived.addListener(
        headerListener,
        { urls: ["<all_urls>"] },
        ["responseHeaders"]
      );
      isCapturing = true;
      console.log("Header capture enabled.");
    } else if (!shouldCapture && isCapturing) {
      // Stop capturing
      if (headerListener) {
        chrome.webRequest.onHeadersReceived.removeListener(headerListener);
      }
      isCapturing = false;
      // Clear any pending data
      chrome.storage.local.set({ capturedRequests: [] });
      console.log("Header capture disabled. Cleared pending data.");
    }
  });
}

// Listen for changes to the server endpoint
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "sync" && changes.serverEndpoint) {
    console.log("Server endpoint changed, updating capture state.");
    updateCaptureState();
  }
});

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
        const headerName = header.name.toLowerCase();
        let headerValue = header.value || "";

        // If the header is in our anonymization list, replace its value.
        if (HEADERS_TO_ANONYMIZE.has(headerName)) {
          headerValue = "(custom value)";
        }

        const key = `${headerName.toLowerCase()}::${headerValue}`;
        if (headerStats[key]) {
          headerStats[key].count++;
        } else {
          headerStats[key] = {
            name: header.name, // Keep original casing for display
            value: headerValue,
            count: 1,
          };
        }
      });
    });

    const payload = {
      timestamp: new Date().toISOString(),
      stats: Object.values(headerStats),
    };

    // Get the configured server endpoint
    chrome.storage.sync.get(["serverEndpoint"], async (result) => {
      const serverEndpoint = result.serverEndpoint || DEFAULT_SERVER_ENDPOINT;
      if (!serverEndpoint || serverEndpoint.trim() === "") {
        console.log(
          "No server endpoint configured. Data collection is disabled. Headers cleared."
        );
        return;
      }

      // Upload to the server
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
            `Successfully uploaded ${requests.length} header sets to ${serverEndpoint}.`
          );
          // The cache has already been cleared.
        } else {
          console.error(`Server responded with status: ${response.status}`);
        }
      } catch (error) {
        console.error("Failed to upload header stats:", error);
      }
    });
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
