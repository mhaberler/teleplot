function isSecure() {
    return window.location.protocol == 'https:';
}

function whichMqttProtocol() {
    return window.location.protocol == 'https:' ? 'wss' : 'ws';
}
