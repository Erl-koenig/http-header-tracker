document.addEventListener("DOMContentLoaded", () => {
  const serverEndpointInput = document.getElementById("serverEndpoint");
  const saveBtn = document.getElementById("saveBtn");
  const statusDiv = document.getElementById("status");

  // Load current settings
  chrome.storage.sync.get(["serverEndpoint"], (result) => {
    const endpoint = result.serverEndpoint || "";
    serverEndpointInput.value = endpoint;
  });

  // Save settings
  saveBtn.addEventListener("click", () => {
    const endpoint = serverEndpointInput.value.trim();

    if (endpoint === "") {
      chrome.storage.sync.set({ serverEndpoint: "" }, () => {
        showStatus("Settings saved! Data collection disabled.", "success");
        serverEndpointInput.value = "";
      });
    } else {
      try {
        new URL(endpoint);
        chrome.storage.sync.set({ serverEndpoint: endpoint }, () => {
          showStatus("Settings saved! Collection enabled.", "success");
        });
      } catch (_) {
        showStatus("Invalid URL format", "error");
      }
    }
  });

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status-message ${type}`;

    // Auto-hide success messages after 3 seconds
    if (type === "success") {
      setTimeout(() => {
        statusDiv.className = "status-message";
      }, 3000);
    }
  }
});
