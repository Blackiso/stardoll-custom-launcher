(function () {

    const { webFrame, remote, ipcRenderer } = require('electron');
    const contextMenu = require('electron-context-menu');

	const webview = document.querySelector('webview');
    const reload = document.querySelector('#reload');
    const back = document.querySelector('#back');
    const minimize = document.querySelector('#minimize');
    const close = document.querySelector('.close');
    const zoomIn = document.querySelector('#zoom-in');
    const zoomOut = document.querySelector('#zoom-out');
    const settings = document.querySelector('#settings');
    const settingsContainer = document.querySelector('.settings-container');
    const fullScreen = document.querySelector('#full-screen');
    const loader = document.querySelector('.loading-screen');
    const title = document.querySelector('.title');
    const more = document.querySelector('#more');
    const dropMenu = document.querySelector('.drop-menu');
    const pageLoader = document.querySelector('.page-loader');
    const zoomLevelEl = document.querySelector('.zoom-level');
    const closeSettings = document.querySelector('.cl');
    const notificationsToggle = document.querySelector('#notifications-toggle');

    let zoomLevel = 0;
    let allowNotifications = window.localStorage.getItem('notifications');

    if (allowNotifications !== null) {
        setNotifications(allowNotifications);
    }

    reload.addEventListener('click', (e) => {
    	webview.reload();
    });

    back.addEventListener('click', (e) => {
    	webview.goBack();
    });

    contextMenu({ 
        window: webview,
        showSearchWithGoogle : true
    });

    function displayZoomLevel() {
        zoomLevelEl.innerHTML = (webview.getZoomFactor()*100).toFixed(0) + '%';
        setTimeout(() => { zoomLevelEl.innerHTML = ''; }, 2000);
    }

    function setZoom(x, reset = null) {
        if (webview) {
            zoomLevel = x ? zoomLevel + 1 : zoomLevel - 1;
            if (reset) zoomLevel = 0;
            webview.setZoomLevel(zoomLevel);
            displayZoomLevel();
        }
    }

    function setNotifications(value) {
        if (typeof value == 'string') value = value === 'true' ? true : false;
        console.log(value);
        notificationsToggle.checked = value;
        window.localStorage.setItem('notifications', value);
    }

    webview.addEventListener('did-finish-load', (e) => {
    	webview.executeJavaScript('let __over = document.querySelector("#controlOverlay");__over && __over.remove();');
		title.innerHTML = webview.getTitle();
	});

	webview.addEventListener('did-stop-loading', (e) => {
		loader.classList.add('hide');
        pageLoader.classList.add('hide');
	});

    webview.addEventListener('did-start-loading', (e) => {
        zoomLevel = webview.getZoomLevel();
        pageLoader.classList.remove('hide');
    });

    webview.addEventListener("did-get-response-details", function(details) {
        console.log(details); 
    }); 

    minimize.addEventListener('click', (e) => {
    	remote.BrowserWindow.getFocusedWindow().minimize();
    });

    close.addEventListener('click', (e) => {
    	remote.BrowserWindow.getFocusedWindow().close();
    });

    zoomIn.addEventListener('click', (e) => {
        setZoom(true);
    });

    zoomOut.addEventListener('click', (e) => {
        setZoom(false);
    });

    settings.addEventListener('click', (e) => {
        settingsContainer.classList.remove('hide');
        dropMenu.classList.toggle('hide');
    });

    closeSettings.addEventListener('click', (e) => {
        settingsContainer.classList.add('hide');
    });

    fullScreen.addEventListener('click', (e) => {
    	let currentWindow = remote.getCurrentWindow()
        currentWindow.setFullScreen(!currentWindow.isFullScreen());
        dropMenu.classList.toggle('hide');
    });

    more.addEventListener('click', (e) => {
    	dropMenu.classList.toggle('hide');
    });

    notificationsToggle.addEventListener('change', (e) => {
        setNotifications(notificationsToggle.checked);
    });

    ipcRenderer.on('zoomIn', (event, messages) => {
        setZoom(true);
    });

    ipcRenderer.on('zoomOut', (event, messages) => {
        setZoom(false);
    });

    ipcRenderer.on('zoomReset', (event, messages) => {
        setZoom(false, true);
    });

    ipcRenderer.on('notification', (event, messages) => {
        if (notificationsToggle.checked) {
            const myNotification = new Notification('New message from ' + messages.$.from.split(':')[1], {
                title: 'New message from ' + messages.$.from.split(':')[1],
                body: messages.body[0],
                icon: './images/icon.ico'
            });
        }
    });

})();