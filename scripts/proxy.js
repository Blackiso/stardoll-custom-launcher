const httpProxy = require("http-proxy");
const http = require("http");
const url = require("url");
const net = require('net');
const events = require('events');
const zlib = require("zlib");
const parseString = require('xml2js').parseString;

exports.ProxyServer = class proxy {

	constructor() {
		this.server = null;
		this.port = 6969;
		this.regex_hostport = /^([^:]+)(:([0-9]+))?$/;
		this.address = 'http://127.0.0.1:'+this.port;
		this.events = new events.EventEmitter();
	}

	run() {
		this.server = http.createServer((req, res) => {
			let urlObj = url.parse(req.url);
		    let target = urlObj.protocol + "//" + urlObj.host;

		    this.proccessRequest(req, res);

		    let proxy = httpProxy.createProxyServer({});
		    proxy.on("error", function(err, req, res) {
		        res.end();
		    });

		    proxy.web(req, res, { target: target });
		}).listen(this.port);
		this.initEvents();
	}

	initEvents() {
		this.server.addListener('connect', (req, socket, bodyhead) => {
		    let hostPort = this.getHostPortFromString(req.url, 443);
		    let hostDomain = hostPort[0];
		    let port = parseInt(hostPort[1]);
		    let proxySocket = new net.Socket();

		    proxySocket.connect(port, hostDomain, function() {
		        proxySocket.write(bodyhead);
		        socket.write("HTTP/" + req.httpVersion + " 200 Connection established\r\n\r\n");
		    });

		    proxySocket.on('data', function(chunk) {
		        socket.write(chunk);
		    });

		    proxySocket.on('end', function() {
		        socket.end();
		    });

		    proxySocket.on('error', function() {
		        socket.write("HTTP/" + req.httpVersion + " 500 Connection error\r\n\r\n");
		        socket.end();
		    });

		    socket.on('data', function(chunk) {
		        proxySocket.write(chunk);
		    });

		    socket.on('end', function() {
		        proxySocket.end();
		    });

		    socket.on('error', function() {
		        proxySocket.end();
		    });
		});
	}

	proccessRequest(request, response) {
		let urlObj = url.parse(request.url);

		response.oldWrite = response.write;
	    response.write = (data) => {
	        if (urlObj.href == 'http://www.stardoll.com/c/') {
	        	parseString(data.toString(), (err, result) => {
	        		if (typeof result.body !== 'undefined' && typeof result.body.message !== 'undefined') {
	        			let message = result.body.message[0];
	        			if (message.$.type && message.$.type == 'chat') {
	        				this.events.emit('message', message);
		        		}
	        		}
	        		
				});
			}
	        response.oldWrite(data);
	    }

	}

	getHostPortFromString(hostString, defaultPort) {
	    let host = hostString;
	    let port = defaultPort;

	    let result = this.regex_hostport.exec(hostString);
	    if (result != null) {
	        host = result[1];
	        if (result[2] != null) {
	            port = result[3];
	        }
	    }

	    return ([host, port]);
	}

}
