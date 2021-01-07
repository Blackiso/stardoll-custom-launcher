const { app, BrowserWindow, BrowserView, globalShortcut, Notification, ipcMain } = require('electron');
const { ProxyServer } = require('./scripts/proxy');
const contextMenu = require('electron-context-menu');
const path = require('path');
const url = require('url');
const parseString = require('xml2js').parseString;
const zlib = require('zlib');
const Proxy = new ProxyServer();

let OFFLINE_MODE = false;
let LANGUAGE_FILTER = false;

app.commandLine.appendSwitch('ppapi-flash-path', path.join((__dirname.includes('.asar') ? process.resourcesPath : __dirname) + '/PepperFlashPlayer.dll'));
app.commandLine.appendSwitch('ppapi-flash-version', '32.0.0.293');
app.commandLine.appendSwitch('ignore-certificate-errors', 'true');

app.setAppUserModelId('Stardoll BL');

function createWindow() {
    Proxy.run(() => {

        const win = new BrowserWindow({
            width: 1200,
            minWidth: 1100,
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

        win.webContents.session.setProxy({ proxyRules: Proxy.address });

        ipcMain.on('set_proxy', (event, x) => {
            win.webContents.session.setProxy({ proxyRules: x ? Proxy.address : '' });
        });

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

        Proxy.useBefore(function(req, res, next) {
            let urlObj = url.parse(req.url);

            if (urlObj.href == 'http://www.stardoll.com/c/' && OFFLINE_MODE) {
                req.target = '';
            }
            next();
        });

        Proxy.useAfter(function(req, res, next) {
            let urlObj = url.parse(req.url);

            if (urlObj.href == 'http://www.stardoll.com/c/') {
                res.oldWrite = res.write;
                res.write = (data) => {
                    parseString(data.toString(), (err, result) => {
                        if (typeof result !== 'undefined' && result !== null && typeof result.body !== 'undefined' && typeof result.body.message !== 'undefined') {
                            let message = result.body.message[0];
                            if (message.$.type && message.$.type == 'chat') {
                                if (!win.isFocused()) {
                                    win.webContents.send('notification', message);
                                }
                            }
                        }
                    });
                    res.oldWrite(data);
                }
            }

            next();
        });

        Proxy.useAfter(function(req, res, next) {
            let urlObj = url.parse(req.url);

            if (urlObj.href == 'http://www.stardoll.com/en/ajax/badwordFilter.php' && !LANGUAGE_FILTER) {
                res.oldWrite = res.write;
                let requestBody = '';

                req.on('data', chunk => {
                    requestBody += chunk;
                });

                res.write = (data) => {
                    const formData = parseFormData(requestBody);
                    res.removeHeader('content-encoding');
                    data = formData.txt;
                    res.oldWrite(data);
                }
            }

            next();
        });

    });

}

function parseFormData(requestBody) {
    const parsedData = decodeURIComponent(requestBody).split('&');
    const formData = {};
    for (let i = 0; i < parsedData.length; i++) {
        let x = parsedData[i].split('=');
        formData[x[0]] = x[1];
    }
    return formData;
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
    OFFLINE_MODE = x;
});

ipcMain.on('language_filter', (event, x) => {
    LANGUAGE_FILTER = x;
});