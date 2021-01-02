const { app, BrowserWindow, BrowserView, globalShortcut, Notification, ipcMain } = require('electron');
const { ProxyServer } = require('./scripts/proxy');
const contextMenu = require('electron-context-menu');
const path = require('path');
const Proxy = new ProxyServer();

app.commandLine.appendSwitch('ppapi-flash-path', path.join((__dirname.includes(".asar") ? process.resourcesPath : __dirname) + '/PepperFlashPlayer.dll'));
app.commandLine.appendSwitch('ppapi-flash-version', '32.0.0.293');

app.setAppUserModelId('Stardoll BL');

function createWindow() {
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

    Proxy.run();

    win.webContents.session.setProxy({ proxyRules: Proxy.address });
    // win.webContents.openDevTools();

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

    Proxy.events.on('message', (x) => {
        if (!win.isFocused()) {
            win.webContents.send('notification', x);
        }
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

ipcMain.on('offline', (event, x) => {
    Proxy.offline(x);
});