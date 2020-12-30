(function () {

    const { webFrame } = require('electron');
	const { remote } = require('electron');
    const contextMenu = require('electron-context-menu');

	const webview = document.querySelector('webview');
    const reload = document.querySelector('#reload');
    const back = document.querySelector('#back');
    const minimize = document.querySelector('#minimize');
    const close = document.querySelector('.close');
    const zoomIn = document.querySelector('#zoom-in');
    const zoomOut = document.querySelector('#zoom-out');
    const fullScreen = document.querySelector('#full-screen');
    const loader = document.querySelector('.loading-screen');
    const title = document.querySelector('.title');
    const more = document.querySelector('#more');
    const dropMenu = document.querySelector('.drop-menu');
    const pageLoader = document.querySelector('.page-loader');

    reload.addEventListener('click', (e) => {
    	webview.reload();
    });

    back.addEventListener('click', (e) => {
    	webview.goBack();
    });

    onload = () => {
        contextMenu({ 
            window: webview,
            showSearchWithGoogle : true
        });
    }

    webview.addEventListener('did-finish-load', (e) => {
    	webview.executeJavaScript('window.zoom=function(o){-1==o?__zoom+=.1:__zoom-=.1,document.body.style.zoom=__zoom,console.log((100*__zoom).toFixed(0)),displayZoomCounter((100*__zoom).toFixed(0))};let __over=document.querySelector("#controlOverlay");__over&&__over.remove();let __zoom=1;function displayZoomCounter(o){var e=document.createElement("SPAN");e.innerHTML=o+"%",e.style.cssText="display: block; padding: 10px; font-size: 14px; color: white; background: black; position: fixed; bottom: 10px; left: 10px; z-index: 6000020; border-radius: 3px;",document.body.appendChild(e),setInterval(()=>{e.remove()},1e3)}window.addEventListener("keydown",o=>{(o.key="Control")&&(window.onmousewheel=(o=>{var e=Math.sign(o.deltaY);window.zoom(e)}))}),window.addEventListener("keyup",o=>{(o.key="Control")&&(window.onmousewheel=null)});');
		title.innerHTML = webview.getTitle();
	});

	webview.addEventListener('did-stop-loading', (e) => {
		loader.classList.add('hide');
        pageLoader.classList.add('hide');
	});

    webview.addEventListener('did-start-loading', (e) => {
        pageLoader.classList.remove('hide');
    });

	webview.addEventListener('dom-ready', () => {
	  // webview.openDevTools();
	});

    minimize.addEventListener('click', (e) => {
    	remote.BrowserWindow.getFocusedWindow().minimize();
    });

    close.addEventListener('click', (e) => {
    	remote.BrowserWindow.getFocusedWindow().close();
    });

    zoomIn.addEventListener('click', (e) => {
        webview.executeJavaScript('window.zoom(-1);');
    });

    zoomOut.addEventListener('click', (e) => {
        webview.executeJavaScript('window.zoom(1);');
    });

    fullScreen.addEventListener('click', (e) => {
    	let currentWindow = remote.getCurrentWindow()
        currentWindow.setFullScreen(!currentWindow.isFullScreen());
        dropMenu.classList.toggle('hide');
    });

    more.addEventListener('click', (e) => {
    	dropMenu.classList.toggle('hide');
    });

})();