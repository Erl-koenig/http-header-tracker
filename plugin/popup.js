document.addEventListener("DOMContentLoaded", () => {
  const requestCountEl = document.getElementById("requestCount");
  const statusTextEl = document.getElementById("statusText");
  const detailsTextEl = document.getElementById("detailsText");
  const clearBtn = document.getElementById("clearBtn");
  const settingsBtn = document.getElementById("settingsBtn");

  // Function to update the request count in the popup
  const updateCount = () => {
    chrome.storage.local.get("capturedRequests", (data) => {
      const count = data.capturedRequests ? data.capturedRequests.length : 0;
      requestCountEl.textContent = count;
    });
  };

  // Function to update status based on configuration
  const updateStatus = () => {
    chrome.storage.sync.get(["serverEndpoint"], (result) => {
      const endpoint = result.serverEndpoint || "";

      if (!endpoint || endpoint.trim() === "") {
        statusTextEl.textContent = "Data Collection Disabled";
        detailsTextEl.textContent =
          "Configure an endpoint in Settings to enable data collection";
      } else {
        statusTextEl.textContent = "Data Collection Active";
        detailsTextEl.textContent = "Sending to: " + endpoint;
      }
    });
  };

  // Initial updates when popup is opened
  updateCount();
  updateStatus();

  // Handle Clear button click
  clearBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "clear" }, (response) => {
      if (response && response.status === "success") {
        updateCount(); // Update count to 0
        console.log("Storage cleared successfully.");
      }
    });
  });

  // Handle Settings button click
  settingsBtn.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  // Listen for storage changes and update status
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "sync" && changes.serverEndpoint) {
      updateStatus();
      updateCount();
    }
    if (areaName === "local" && changes.capturedRequests) {
      updateCount();
    }
  });
});
