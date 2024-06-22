const {
    app,
    BrowserWindow,
    ipcMain,
    dialog
} = require('electron');
const path = require('path');
const fs = require('fs');

app.setName("Emeji Connection Monitor");

// Use user data directory for logs
const logRootDir = path.join(app.getPath('userData'), 'logs');
const connectivityLog = path.join(logRootDir, 'connectivity.log');

const ensureLogDir = () => {
    if (!fs.existsSync(logRootDir)) {
        fs.mkdirSync(logRootDir, {
            recursive: true
        });
    }
};

const appendDate = (filename) => {
    const date = new Date().toISOString().split('T')[0];
    const ext = path.extname(filename);
    const base = path.basename(filename, ext);
    return `${base}-${date}${ext}`;
}

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));
    //mainWindow.webContents.openDevTools();
}

function logStatus(status) {
    const logMessage = `${new Date().toISOString()} - ${status}\n`;
    fs.appendFile(connectivityLog, logMessage, (err) => {
        if (err) {
            console.error('Failed to write to log file:', err);
        }
    });
}

function readLogs() {
    return new Promise((resolve, reject) => {
        fs.readFile(connectivityLog, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

function exportAllLogs(destination) {
    return new Promise((resolve, reject) => {
        fs.copyFile(connectivityLog, destination, (err) => {
            if (err) {
                return reject(err);
            } else {
                resolve(destination); // Resolve with the destination path
            }
        });
    });
}

function exportDisconnectedLogs(destination) {
    return new Promise((resolve, reject) => {
        fs.readFile(connectivityLog, 'utf8', (err, data) => {
            if (err) {
                return reject(err);
            }
            const disconnectedLogs = data.split('\n').filter(log => log.includes('Wi-Fi disconnected')).join('\n');

            fs.writeFile(destination, disconnectedLogs, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(destination);
                }
            });
        });

    });
}

function exportNoInternetLogs(destination) {
    return new Promise((resolve, reject) => {
        fs.readFile(connectivityLog, 'utf8', (err, data) => {
            if (err) {
                return reject(err);
            }

            const noInternetLogs = data.split('\n').filter(log => log.includes('Wi-Fi connected but no internet')).join('\n');
            fs.writeFile(destination, noInternetLogs, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(destination); // Resolve with the destination path
                }
            });
        });
    });
}

app.on('ready', () => {
    ensureLogDir();
    createWindow();
});

app.whenReady().then(() => {
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });

    ipcMain.on('status-update', (event, status) => {
        logStatus(status);
    });

    ipcMain.handle('get-logs', async () => {
        const logs = await readLogs();
        return logs;
    });

    ipcMain.handle('export-all-logs', async (event) => {
        const {
            canceled,
            filePath
        } = await dialog.showSaveDialog({
            title: "Save All Logs",
            defaultPath: appendDate('exported-connectivity-logs-emeji.log'),
            filters: [{
                name: 'Log Files',
                extensions: ['log']
            }]
        });
        if (canceled || !filePath) {
            return null;
        }
        await exportAllLogs(filePath);
        return filePath;
    });

    ipcMain.handle('export-no-internet-logs', async (event) => {
        const {
            canceled,
            filePath
        } = await dialog.showSaveDialog({
            title: 'Save "Wi-Fi connected but no internet" Logs',
            defaultPath: appendDate('exported-no-internet-logs-emeji.log'),
            filters: [{
                name: 'Log Files',
                extensions: ['log']
            }]
        });
        if (canceled || !filePath) {
            return null;
        }
        await exportNoInternetLogs(filePath);
        return filePath;
    });

    ipcMain.handle('export-disconnected-logs', async (event) => {
        const {
            canceled,
            filePath
        } = await dialog.showSaveDialog({
            title: 'Save "Wi-Fi disconnected" Logs',
            defaultPath: appendDate('exported-disconnected-logs.log'),
            filters: [{
                name: 'Log Files',
                extensions: ['log']
            }]
        });
        if (canceled || !filePath) {
            return null;
        }
        await exportDisconnectedLogs(filePath);
        return filePath;
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
