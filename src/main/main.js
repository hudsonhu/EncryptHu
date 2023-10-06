const { app, BrowserWindow } = require('electron');
let mainWindow;
const path = require('path');

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 850,
        height: 715,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html')).then(r => console.log(r));
    mainWindow.webContents.openDevTools();

    // handle window close
    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});
