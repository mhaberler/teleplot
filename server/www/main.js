// Init Vue

var vscode = null;
if ("acquireVsCodeApi" in window) vscode = acquireVsCodeApi();

var app = initializeAppView();
var ansi_coloring = new AnsiUp();

let use_mqtt = true;

//Init refresh rate
setInterval(updateView, 1000 / widgetFPS);


if (vscode) {
    let conn = new ConnectionTeleplotVSCode();
    conn.connect();
    app.connections.push(conn);
}
else {
    if (use_mqtt) {
        let conn = new ConnectionTeleplotMQTT();
        let addr = "mqtt-test.mah.priv.at"; // window.location.hostname;
        let port = 1443; // window.location.port;
        conn.connect(addr, port);
        app.connections.push(conn);
    } else {
        let conn = new ConnectionTeleplotWebsocket();
        let addr = window.location.hostname;
        let port = window.location.port;
        conn.connect(addr, port);
        app.connections.push(conn);
    }

    // Parse url params
    let params = new URLSearchParams(window.location.search);

    // Open layout from url
    let layout = params.get("layout")
    if (layout) {
        fetch(layout).then(res => res.blob()).then(blob => {
            importLayoutJSON({ target: { files: [blob] } });
        });
    }
}


setInterval(() => {
    for (let conn of app.connections) {
        conn.updateCMDList();
    }
}, 3000);

