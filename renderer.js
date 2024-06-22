const {
    ipcRenderer
} = require('electron');
const Chart = require('chart.js/auto');

let chart; // Reference to the chart instance

function checkConnectivity() {
    const statusDiv = document.getElementById('status');
    let statusMessage;

    if (navigator.onLine) {
        // Perform an additional check to ensure internet connectivity
        fetch('https://www.google.com', {
                method: 'HEAD'
            })
            .then(() => {
                statusMessage = 'Online';
                statusDiv.innerHTML = '<h1 class="online">You are online</h1>';
                ipcRenderer.send('status-update', statusMessage);
            })
            .catch(() => {
                statusMessage = 'Wi-Fi connected but no internet';
                statusDiv.innerHTML = '<h1 class="offline">Wi-Fi connected but no internet</h1>';
                ipcRenderer.send('status-update', statusMessage);
            });
    } else {
        statusMessage = 'Wi-Fi disconnected';
        statusDiv.innerHTML = '<h1 class="offline">Wi-Fi disconnected</h1>';
        ipcRenderer.send('status-update', statusMessage);
    }
}

function updateChart(logs) {
    const logEntries = logs.trim().split('\n').map(log => {
        const [timestamp, status] = log.split(' - ');
        return {
            timestamp: new Date(timestamp),
            status: status.trim()
        };
    });

    const labels = logEntries.map(entry => entry.timestamp.toLocaleString());
    const data = logEntries.map(entry => {
        if (entry.status === 'Online') return 1;
        if (entry.status === 'Wi-Fi connected but no internet') return 0.5;
        return 0;
    });

    if (chart) {
        // Update the existing chart
        chart.data.labels = labels;
        chart.data.datasets[0].data = data;
        chart.update();
    } else {
        // Create a new chart
        const ctx = document.getElementById('logChart').getContext('2d');
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Internet Connection Status',
                    data: data,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                    fill: false,
                    stepped: true
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                if (value === 1) return 'Online';
                                if (value === 0.5) return 'Wi-Fi connected but no internet';
                                return 'Wi-Fi disconnected';
                            },
                            max: 1,
                            min: 0,
                            stepSize: 0.5
                        }
                    }
                }
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // Initial check and chart rendering
    checkConnectivity();
    const logs = await ipcRenderer.invoke('get-logs');
    updateChart(logs);

    // Set interval to check connectivity every 10 seconds
    setInterval(async () => {
        checkConnectivity();
        const logs = await ipcRenderer.invoke('get-logs');
        updateChart(logs);
    }, 10000);

    // Add event listener for export button
    document.getElementById('exportLogsButton').addEventListener('click', async () => {
        try {
            const destination = await ipcRenderer.invoke('export-no-internet-logs');
            if (destination) {
                alert(`Logs exported successfully to: ${destination}`);
            }
        } catch (error) {
            alert(`Error exporting logs: ${error.message}`);
        }
    });

    document.getElementById('exportAllLogsButton').addEventListener('click', async () => {
        try {
            const destination = await ipcRenderer.invoke('export-all-logs');
            if (destination) {
                alert(`Logs exported successfully to: ${destination}`);
            }
        } catch (error) {
            alert(`Error exporting logs: ${error.message}`);
        }
    });

    document.getElementById('exportDisconnectedLogsButton').addEventListener('click', async () => {
        try {
            const destination = await ipcRenderer.invoke('export-disconnected-logs');
            if (destination) {
                alert(`Logs exported successfully to: ${destination}`);
            }
        } catch (error) {
            alert(`Error exporting logs: ${error.message}`);
        }
    });
});
