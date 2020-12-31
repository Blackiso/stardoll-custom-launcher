const { app, BrowserWindow, BrowserView, globalShortcut, ipcMain } = require('electron');
const contextMenu = require('electron-context-menu');
const path = require('path');

app.commandLine.appendSwitch('ppapi-flash-path', path.join((__dirname.includes(".asar") ? process.resourcesPath : __dirname) + '/PepperFlashPlayer.dll'))
app.commandLine.appendSwitch('ppapi-flash-version', '32.0.0.293');



function createWindow() {
    console.log(process.versions);
    const view = new BrowserView();
    const win = new BrowserWindow({
        width: 1200,
        minWidth: 1050,
        minHeight: 500,
        height: 800,
        frame: false,
        webPreferences: {
            webviewTag: true,
            nodeIntegration: true,
            plugins: true,
            enableRemoteModule: true,
            spellcheck: true
        }
    });
    win.loadURL(`file://${__dirname}/main.html`);
    win.webContents.openDevTools();

    globalShortcut.register('CommandOrControl+Up', () => {
        console.log('Zoom+');
        win.webContents.send('zoomIn', '');
    });

    globalShortcut.register('CommandOrControl+Down', () => {
        win.webContents.send('zoomOut', '');
    });

    globalShortcut.register('CommandOrControl+0', () => {
        win.webContents.send('zoomReset', '');
    });

}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

