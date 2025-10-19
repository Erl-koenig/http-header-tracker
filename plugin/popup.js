document.addEventListener("DOMContentLoaded", () => {
  const statsCountEl = document.getElementById("statsCount");
  const statusTextEl = document.getElementById("statusText");
  const detailsTextEl = document.getElementById("detailsText");
  const exportBtn = document.getElementById("exportBtn");
  const settingsBtn = document.getElementById("settingsBtn");

  // Function to update the stats count in the popup
  const updateCount = () => {
    chrome.runtime.sendMessage({ action: "getStats" }, (response) => {
      if (response && response.status === "success") {
        statsCountEl.textContent = response.totalEntries;
      }
    });
  };

  // Function to update status based on configuration
  const updateStatus = () => {
    chrome.storage.sync.get(["serverEndpoint"], (result) => {
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
  exportBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "exportStats" }, (response) => {
      if (response && response.status === "success") {
        const dataStr = JSON.stringify(response.stats, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `header-stats-${timestamp}.json`;

        chrome.downloads.download(
          {
            url: url,
            filename: filename,
            saveAs: true,
          },
          () => {
            URL.revokeObjectURL(url);
          },
        );
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
