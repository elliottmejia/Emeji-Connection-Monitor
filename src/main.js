const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs");

var isDev = process.env.APP_DEV ? process.env.APP_DEV.trim() == "true" : false;

app.setName("Emeji Connection Monitor");

// //TODO: Configure isDev
// // TODO: fix preload script to use contextBridge
// // TODO: fix renderer script to use bridged ipcRenderer
// // TODO: configure webpack in order to bundle the renderer script as a module
// // TODO: configure webpack to disable source maps in development
// // TODO: implement basic content policy.
// TODO: Scale chart to container
// TODO: implement zoom
// TODO: scale the chart based on time, not number of logs
//TODO: Add a menu to export logs
//TODO: Add a menu to open logs directory
//TODO: poll faster when disconnected
//TODO: settings panel for polling interval
//TODO: settings panel for log retention
//TODO: settings panel for log directory

const logRootDir = path.join(app.getPath("userData"), "logs");

let connectivityLog = path.join(logRootDir, "dev_connectivity.log");

if (!isDev) {
  connectivityLog = path.join(logRootDir, "connectivity.log");
}

const ensureLogDir = () => {
  if (!fs.existsSync(logRootDir)) {
    fs.mkdirSync(logRootDir, {
      recursive: true,
    });
  }
};

const appendDate = (filename) => {
  const date = new Date().toISOString().split("T")[0];
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  return `${base}-${date}${ext}`;
};

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.resolve(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));
  //mainWindow.webContents.openDevTools();
}

function logStatus(status) {
  const logMessage = `${new Date().toISOString()} - ${status}\n`;
  fs.appendFile(connectivityLog, logMessage, (err) => {
    if (err) {
      console.error("Failed to write to log file:", err);
    }
  });
}

function readLogs() {
  return new Promise((resolve, reject) => {
    fs.readFile(connectivityLog, "utf8", (err, data) => {
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
    fs.readFile(connectivityLog, "utf8", (err, data) => {
      if (err) {
        return reject(err);
      }
      const disconnectedLogs = data
        .split("\n")
        .filter((log) => log.includes("Wi-Fi disconnected"))
        .join("\n");

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
    fs.readFile(connectivityLog, "utf8", (err, data) => {
      if (err) {
        return reject(err);
      }

      const noInternetLogs = data
        .split("\n")
        .filter((log) => log.includes("Wi-Fi connected but no internet"))
        .join("\n");
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

app.on("ready", () => {
  ensureLogDir();
  createWindow();
});

app.whenReady().then(() => {
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  ipcMain.handle("is-dev", async () => {
    return process.env.APP_DEV ? process.env.APP_DEV.trim() == "true" : false;
  });

  ipcMain.on("status-update", (event, status) => {
    logStatus(status);
  });

  ipcMain.handle("get-logs", async () => {
    const logs = await readLogs();
    return logs;
  });

  ipcMain.handle("open-logs-dir", async () => {
    shell.showItemInFolder(connectivityLog);
  });

  ipcMain.handle("export-all-logs", async (event) => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: "Save All Logs",
      defaultPath: appendDate("exported-connectivity-logs-emeji.log"),
      filters: [
        {
          name: "Log Files",
          extensions: ["log"],
        },
      ],
    });
    if (canceled || !filePath) {
      return null;
    }
    await exportAllLogs(filePath);
    return filePath;
  });

  ipcMain.handle("export-no-internet-logs", async (event) => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Save "Wi-Fi connected but no internet" Logs',
      defaultPath: appendDate("exported-no-internet-logs-emeji.log"),
      filters: [
        {
          name: "Log Files",
          extensions: ["log"],
        },
      ],
    });
    if (canceled || !filePath) {
      return null;
    }
    await exportNoInternetLogs(filePath);
    return filePath;
  });

  ipcMain.handle("export-disconnected-logs", async (event) => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Save "Wi-Fi disconnected" Logs',
      defaultPath: appendDate("exported-disconnected-logs.log"),
      filters: [
        {
          name: "Log Files",
          extensions: ["log"],
        },
      ],
    });
    if (canceled || !filePath) {
      return null;
    }
    await exportDisconnectedLogs(filePath);
    return filePath;
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
