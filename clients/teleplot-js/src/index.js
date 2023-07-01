
// index.js
import ReconnectingWebSocket from 'reconnecting-websocket';

var teleplot_ws = null;

function plot(v) {
    if (teleplot_ws) {
        teleplot_ws.send(v);
    }
}

function connect(serverUrl) {
    teleplot_ws = new ReconnectingWebSocket(serverUrl, "json");

    teleplot_ws.onopen = function () {
        console.log("onopen");
        // teleplot_ws.send("hi!");
    };

    teleplot_ws.onmessage = function (evt) {
        var msg = JSON.parse(evt.data);
        console.log("Message received: ");
        console.dir(msg);
    };
    return teleplot_ws;
}

module.exports = { connect, plot };
