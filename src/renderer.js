import Chart from "chart.js/auto";

let chart; // Reference to the chart instance
let CONNECTIVITY_INTERVAL = 10000; // 10 seconds

function checkConnectivity() {
  const statusDiv = document.getElementById("status");
  let statusMessage;

  if (navigator.onLine) {
    // Perform an additional check to ensure internet connectivity
    fetch("https://www.google.com", {
      method: "HEAD",
    })
      .then(() => {
        statusMessage = "1";
        statusDiv.innerHTML = '<h1 class="online">You are online</h1>';
        window.ipcRenderer.send("status-update", statusMessage);
      })
      .catch(() => {
        statusMessage = "0.5";
        statusDiv.innerHTML =
          '<h1 class="offline">Wi-Fi connected but no internet</h1>';
        window.ipcRenderer.send("status-update", statusMessage);
      });
  } else {
    statusMessage = "0";
    statusDiv.innerHTML = '<h1 class="offline">Wi-Fi disconnected</h1>';
    window.ipcRenderer.send("status-update", statusMessage);
  }
}

function intToStatus(status) {
  switch (status) {
    case 1:
      return "Online";
    case 0.5:
      return "Wi-Fi connected but no internet";
    case 0:
      return "Wi-Fi disconnected";
  }
}

function updateChart(logs) {
  const logEntries = logs
    .trim()
    .split("\n")
    .map((log) => {
      const [timestamp, status] = log.split(" - ");
      return {
        timestamp: new Date(timestamp),
        status: status.trim(),
      };
    });

  const labels = logEntries.map((entry) => entry.timestamp.toLocaleString());
  const data = logEntries.map((entry) => {
    // switch to 1, 0.5, 0
    return parseFloat(entry.status);
  });

  if (chart) {
    // Update the existing chart
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update();
  } else {
    // Create a new chart
    const ctx = document.getElementById("logChart").getContext("2d");
    chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            // previously internet connection status
            label: "",
            data: data,
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
            fill: false,
            stepped: true,
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return intToStatus(context.raw);
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return intToStatus(value);
              },
              max: 1,
              min: 0,
              stepSize: 0.5,
            },
          },
        },
      },
    });
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  // Initial check and chart rendering
  checkConnectivity();
  const logs = await window.ipcRenderer.invoke("get-logs");
  updateChart(logs);

  // Set interval to check connectivity every 10 seconds
  setInterval(async () => {
    checkConnectivity();
    const logs = await window.ipcRenderer.invoke("get-logs");
    updateChart(logs);
  }, CONNECTIVITY_INTERVAL);

  const isDev = await window.ipcRenderer.invoke("is-dev");

  if (isDev) {
    document.getElementById("dev-mode-display").classList.remove("hidden");
  } else {
    console.log("apsohdg");
  }

  // Add event listener for export button
  document
    .getElementById("exportLogsButton")
    .addEventListener("click", async () => {
      try {
        const destination = await window.ipcRenderer.invoke(
          "export-no-internet-logs"
        );
        if (destination) {
          alert(`Logs exported successfully to: ${destination}`);
        }
      } catch (error) {
        alert(`Error exporting logs: ${error.message}`);
      }
    });

  document
    .getElementById("exportAllLogsButton")
    .addEventListener("click", async () => {
      try {
        const destination = await window.ipcRenderer.invoke("export-all-logs");
        if (destination) {
          alert(`Logs exported successfully to: ${destination}`);
        }
      } catch (error) {
        alert(`Error exporting logs: ${error.message}`);
      }
    });

  document
    .getElementById("openLogsDirButton")
    .addEventListener("click", async () => {
      try {
        const opened = await window.ipcRenderer.invoke("open-logs-dir");
        opened
          ? console.log("Logs directory opened")
          : console.error("Logs directory not opened");
      } catch (error) {
        console.error("OPEN LOGS DIR ERROR", error);
      }
    });

  document
    .getElementById("exportDisconnectedLogsButton")
    .addEventListener("click", async () => {
      try {
        const destination = await window.ipcRenderer.invoke(
          "export-disconnected-logs"
        );
        if (destination) {
          alert(`Logs exported successfully to: ${destination}`);
        }
      } catch (error) {
        alert(`Error exporting logs: ${error.message}`);
      }
    });
});
