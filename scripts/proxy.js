const httpProxy = require('http-proxy');
const http = require('http');
const https = require('https');
const url = require('url');
const net = require('net');
const events = require('events');
const fs = require('fs');

exports.ProxyServer = class proxy {

    constructor() {
        this.server = null;
        this.port = 8006;
        this.address = 'http://127.0.0.1:' + this.port;
        this.proxy = httpProxy.createProxyServer();
        this.middleware = {
            after: [],
            before: []
        }
    }

    run(call) {
        this.server = http.createServer(async (request, response) => {

            let urlObj = url.parse(request.url);
            let target = urlObj.protocol + '//' + urlObj.host;

            request.target = target;

            console.log('Proxy HTTP request for:', request.target);

            this.runMiddleware('before', request, response);

            this.proxy.web(request, response, { target: request.target }, function(e) {
                if (e) console.log(e);
            });

        }).listen(this.port, (e) => {
            if (e) return console.log(e);
            call();
        });

        this.proxy.on('proxyReq', (proxyReq, req, res, options) => {
            this.runMiddleware('after', req, res);
        });

        this.server.on('connect', (req, clientSocket, head) => {
            const { port, hostname } = url.parse(`//${req.url}`, false, true);
            if (hostname && port) {
                const serverErrorHandler = (err) => {
                    console.error(err.message);
                    if (clientSocket) {
                        clientSocket.end(`HTTP/1.1 500 ${err.message}\r\n`);
                    }
                }
                const serverEndHandler = () => {
                    if (clientSocket) {
                        clientSocket.end(`HTTP/1.1 500 External Server End\r\n`);
                    }
                }
                const serverSocket = net.connect(port, hostname);
                const clientErrorHandler = (err) => {
                    console.error(err.message);
                    if (serverSocket) {
                        serverSocket.end();
                    }
                }
                const clientEndHandler = () => {
                    if (serverSocket) {
                        serverSocket.end();
                    }
                }
                clientSocket.on('error', clientErrorHandler);
                clientSocket.on('end', clientEndHandler);
                serverSocket.on('error', serverErrorHandler);
                serverSocket.on('end', serverEndHandler);
                serverSocket.on('connect', () => {
                    clientSocket.write([
                        'HTTP/1.1 200 Connection Established',
                        'Proxy-agent: Node-VPN',
                    ].join('\r\n'));
                    clientSocket.write('\r\n\r\n');
                    serverSocket.pipe(clientSocket, { end: false });
                    clientSocket.pipe(serverSocket, { end: false });
                })
            } else {
                clientSocket.end('HTTP/1.1 400 Bad Request\r\n');
                clientSocket.destroy();
            }
        })
    }

    runMiddleware(type, req, res) {
        let prevIndex = -1;
        let execute = (index) => {
            if (index <= this.middleware[type].length - 1 && prevIndex !== index) {
                prevIndex = index;
                this.middleware[type][index](req, res, () => {
                    execute(index + 1);
                });
            }
        }

        execute(0);
    }

    useAfter(func) {
        if (typeof func === 'function') {
            this.middleware.after.push(func);
        }
    }

    useBefore(func) {
        if (typeof func === 'function') {
            this.middleware.before.push(func);
        }
    }

}