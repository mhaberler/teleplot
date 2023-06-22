const requestDelay = 50;// every requestDelay milliseconds, we send a websocket packet 

const myEnv = require(`dotenv-defaults`).config({
    MDNS: 1,
    UDP_PORT: 47269,
    CMD_UDP_PORT: 47268,
    HTTP_WS_PORT: 8080,
    HTTP_WSCLIENT_PORT: 8081
});

const udp = require('dgram');
var mdns = require('mdns-js');

var express = require('express');
var app = express();
var expressWs = require('express-ws')(app);
var wsclientApp = express();
require('express-ws')(wsclientApp);


// packets are being grouped up in this string and sent all together later on ( we have just added a line break between each )
let groupedUpPacket = "";
var service = null;
var wsservice = null;
var httpservice = null;

if (+process.env.MDNS) {
    console.log(`advertising _teleplot._http service on port ${process.env.HTTP_WS_PORT}`);
    httpservice = mdns.createAdvertisement(mdns.tcp('_http'), +process.env.HTTP_WS_PORT, {
        name: 'Teleplot',
        txt: {
            txtvers: '1'
        }
    });
    httpservice.start();

    console.log(`advertising _teleplot._udp service on port ${process.env.UDP_PORT}`);
    service = mdns.createAdvertisement(mdns.udp('_teleplot'), +process.env.UDP_PORT, {
        name: 'Teleplot UDP server',
        txt: {
            txtvers: '1'
        }
    });
    service.start();

    if (+process.env.HTTP_WSCLIENT_PORT) {
        console.log(`advertising _teleplotws._tcp service on port ${process.env.HTTP_WSCLIENT_PORT}`);
        wsservice = mdns.createAdvertisement(mdns.tcp('_teleplotws'), +process.env.HTTP_WSCLIENT_PORT, {
            name: 'Teleplot Websocket',
            txt: {
                txtvers: '1'
            }
        });
        wsservice.start();
    }
}

//Setup file server
app.use(express.static(__dirname + '/www'))

//Setup websocket server
app.ws('/', (ws, req) => {
    ws.on('message', function (msgStr) {
        try {
            let msg = JSON.parse(msgStr);
            udpServer.send(msg.cmd, +process.env.CMD_UDP_PORT);
        }
        catch (e) { }
    });
});
app.listen(+process.env.HTTP_WS_PORT);

if (+process.env.HTTP_WSCLIENT_PORT) {
    //Setup websocket server for clients sending telemetry via websocket
    wsclientApp.ws('/', (ws, req) => {
        ws.on("connection", () => {
            console.log("ws client connection");
        });
        ws.on('message', function (msgStr) {
            // relay incoming ws telemtry
            try {
                groupedUpPacket += ("\n" + msgStr);
            }
            catch (e) { }
        });
        ws.on('connect', function (msgStr) {
            try {
                console.log(msgStr);
            }
            catch (e) { }
        });
    });
    wsclientApp.listen(+process.env.HTTP_WSCLIENT_PORT);
}

// Setup UDP server
var udpServer = udp.createSocket('udp4');
udpServer.bind(+process.env.UDP_PORT);


// Relay UDP packets to Websocket
udpServer.on('message', function (msg, info) {
    groupedUpPacket += ("\n" + msg.toString());
});


// every requestDelay ms, we send the packets (no need to send them at a higher frequency as it will just slow teleplot)
setInterval(() => {
    if (groupedUpPacket != "") {
        expressWs.getWss().clients.forEach((client) => {
            client.send(JSON.stringify({ data: groupedUpPacket, fromSerial: false, timestamp: new Date().getTime() }), { binary: false });
        });
    }

    groupedUpPacket = "";
}, requestDelay);

// stop on Ctrl-C
process.on('SIGINT', function () {
    console.log("\nshutting down");
    if (httpservice) {
        console.log("deregister _teleplot._http");
        httpservice.stop();
    }
    if (service) {
        console.log("deregister _teleplot._udp");
        service.stop();
    }
    if (wsservice) {
        console.log("deregister _teleplotws._tcp");
        wsservice.stop();
    }
    // give deregistration a little time
    setTimeout(function onTimeout() {
        process.exit();
    }, 1000);
});

console.log("Teleplot server started");
console.log(`Open your browser at 127.0.0.1:${process.env.HTTP_WS_PORT}`);
console.log(`Send telemetry with a "key:value" UDP packet to 127.0.0.1:${process.env.UDP_PORT}`);
console.log(`Example:`);
console.log(`\t BASH: echo "myData:1234" | nc -u -w0 127.0.0.1 ${process.env.UDP_PORT}`);
