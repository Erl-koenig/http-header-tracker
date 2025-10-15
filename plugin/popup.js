document.addEventListener('DOMContentLoaded', () => {
    const requestCountEl = document.getElementById('requestCount');
    const clearBtn = document.getElementById('clearBtn');

    // Function to update the request count in the popup
    const updateCount = () => {
        chrome.storage.local.get('capturedRequests', (data) => {
            const count = data.capturedRequests ? data.capturedRequests.length : 0;
            requestCountEl.textContent = count;
        });
    };

    // Initial count update when popup is opened
    updateCount();

    // Handle Clear button click
    clearBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: "clear" }, (response) => {
            if (response && response.status === "success") {
                updateCount(); // Update count to 0
                console.log("Storage cleared successfully.");
            }
        });
    });
});
