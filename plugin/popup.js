document.addEventListener("DOMContentLoaded", () => {
  const statsCountEl = document.getElementById("statsCount");
  const statusTextEl = document.getElementById("statusText");
  const detailsTextEl = document.getElementById("detailsText");
  const exportBtn = document.getElementById("exportBtn");
  const settingsBtn = document.getElementById("settingsBtn");

  // Function to update the stats count in the popup
  const updateCount = () => {
    browser.runtime.sendMessage({ action: "getStats" }, (response) => {
      if (response && response.status === "success") {
        statsCountEl.textContent = response.totalEntries;
      }
    });
  };

  // Function to update status based on configuration
  const updateStatus = () => {
    browser.storage.sync.get(["serverEndpoint"], (result) => {
      const endpoint = result.serverEndpoint || "";

      if (!endpoint || endpoint.trim() === "") {
        statusTextEl.textContent = "Mode: Local-Only";
        detailsTextEl.textContent =
          "Data stored locally. Use Export to download.";
      } else {
        statusTextEl.textContent = "Mode: Local + Server";
        detailsTextEl.textContent = "Uploading to: " + endpoint;
      }
    });
  };

  // Initial updates when popup is opened
  updateCount();
  updateStatus();

  // Handle Export button click
  exportBtn.addEventListener("click", async () => {
    await browser.runtime.sendMessage({
      action: "exportStats",
    });
  });

  // Handle Settings button click
  settingsBtn.addEventListener("click", () => {
    browser.runtime.openOptionsPage();
  });

  // Listen for storage changes and update status
  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "sync" && changes.serverEndpoint) {
      updateStatus();
      updateCount();
    }
    if (areaName === "local" && changes.capturedRequests) {
      updateCount();
    }
  });
});
