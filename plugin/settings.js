document.addEventListener("DOMContentLoaded", () => {
  const serverEndpointInput = document.getElementById("serverEndpoint");
  const saveBtn = document.getElementById("saveBtn");
  const testBtn = document.getElementById("testBtn");
  const statusMsg = document.getElementById("statusMsg");

  const uploadFrequencySelect = document.getElementById("uploadFrequency");
  const saveFrequencyBtn = document.getElementById("saveFrequencyBtn");
  const frequencyStatusDiv = document.getElementById("frequencyStatus");

  const totalStatsSpan = document.getElementById("totalStats");
  const clearDataBtn = document.getElementById("clearDataBtn");
  const clearStatus = document.getElementById("clearStatus");

  // Load current settings
  browser.storage.sync.get(["serverEndpoint", "uploadFrequency"], (result) => {
    const endpoint = result.serverEndpoint || "";
    serverEndpointInput.value = endpoint;

    const frequency = result.uploadFrequency || 5;
    uploadFrequencySelect.value = frequency;
  });

  // Load and display current stats count
  const updateStatsCount = () => {
    browser.runtime.sendMessage({ action: "getStats" }, (response) => {
      if (response && response.status === "success") {
        totalStatsSpan.textContent = `${response.totalEntries} header entries`;
      } else {
        totalStatsSpan.textContent = "0 header entries";
      }
    });
  };

  updateStatsCount();

  // Save settings
  saveBtn.addEventListener("click", () => {
    const endpoint = serverEndpointInput.value.trim();

    if (endpoint === "") {
      browser.storage.sync.set({ serverEndpoint: "" }, () => {
        showStatus("Settings saved!", "success", statusMsg);
        serverEndpointInput.value = "";
      });
    } else {
      try {
        new URL(endpoint);
        browser.storage.sync.set({ serverEndpoint: endpoint }, () => {
          showStatus("Settings saved!", "success", statusMsg);
        });
      } catch (_) {
        showStatus("Invalid URL format", "error", statusMsg);
      }
    }
  });

  // Test connection
  testBtn.addEventListener("click", async () => {
    const endpoint = serverEndpointInput.value.trim();

    if (!endpoint) {
      showStatus("Please enter a server URL first", "error", statusMsg);
      return;
    }

    // Validate URL format
    try {
      new URL(endpoint);
    } catch (_) {
      showStatus("Invalid URL format", "error", statusMsg);
      return;
    }

    try {
      // Send empty stats array
      const payload = {
        timestamp: new Date().toISOString(),
        stats: [],
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        showStatus("Connection successful!", "success", statusMsg);
      } else {
        showStatus(`Server error: ${response.status}`, "error", statusMsg);
      }
    } catch (error) {
      showStatus("Connection failed - server unreachable", "error", statusMsg);
    }
  });

  // Save upload frequency
  saveFrequencyBtn.addEventListener("click", () => {
    const frequency = parseInt(uploadFrequencySelect.value);
    browser.storage.sync.set({ uploadFrequency: frequency }, () => {
      showStatus(
        "Frequency saved! Will take effect on next upload.",
        "success",
        frequencyStatusDiv,
      );
    });
  });

  // Clear all data
  clearDataBtn.addEventListener("click", () => {
    browser.storage.sync.get(["serverEndpoint"], (result) => {
      const endpoint = result.serverEndpoint || "";
      const isServerMode = endpoint && endpoint.trim() !== "";

      let confirmMessage =
        "Clear all collected headers?\n\n" +
        "This will delete all locally stored data. This cannot be undone.";

      if (isServerMode) {
        confirmMessage +=
          "\n\nNote: Previously uploaded server data is not affected.";
      }

      const confirmed = confirm(confirmMessage);

      if (confirmed) {
        browser.runtime.sendMessage({ action: "clearAll" }, (response) => {
          if (response && response.success) {
            showStatus(
              "All data cleared successfully!",
              "success",
              clearStatus,
            );
            updateStatsCount();
          } else {
            showStatus("Failed to clear data", "error", clearStatus);
          }
        });
      }
    });
  });

  function showStatus(message, type, statusElement) {
    statusElement.textContent = message;
    statusElement.className = `status-message ${type}`;

    // Auto-hide success messages after 3 seconds
    if (type === "success") {
      setTimeout(() => {
        statusElement.className = "status-message";
      }, 3000);
    }
  }
});
