class ConnectionTeleplotMQTT extends Connection{
    constructor(){
        super();
        this.name=""
        this.type = "teleplot-MQTT";
        this.inputs = [];
        this.client_id = 'teleplot_' + Math.random().toString(16).substring(2, 8)
        this.client = null;
        this.address = "";
        this.port = "";
        this.udp = new DataInputUDP(this, "UDP");
        this.udp.address = "";
        this.udp.port = UDPport;
        this.inputs.push(this.udp);
    }

    connect(_address, _port){
        this.name = _address+":"+_port;
        this.address = _address;
        this.port = _port;
        this.udp.address = this.address;
        const options = { // https://github.com/mqttjs/MQTT.js#mqttclientstreambuilder-options
            host: this.address,
            port: this.port,
            username: "",
            password: "",
            clientId: this.client_id,
            clean: true,
            connectTimeout: 5000,
            reconnectPeriod: 1000,
            protocol: whichMqttProtocol(),
            keepalive: 30,
            wsOptions: { perMessageDeflate: true }
        }
        this.client = mqtt.connect(options);
        this.client.on('error', (err) => {
            console.log(`MQTT Connection error: ${err}`)
            this.client.end()
        })

        this.client.on('reconnect', () => {
            notyf.success('MQTT Reconnecting...');
        })
        this.client.on('connect', () => {
            console.log('MQTT client connected: ' + this.client_id);
            this.client.subscribe("teleplot");
            this.udp.connected = true;
            this.connected = true;
            this.sendServerCommand({ cmd: "listSerialPorts"});
        });
        this.client.on('close', () => {
            this.udp.connected = false;
            this.connected = false;
            for(let input of this.inputs){
                input.disconnect();
            }
            // setTimeout(()=>{
            //     this.connect(this.address, this.port);
            // }, 2000);
        });

        //             client.send(JSON.stringify({data: groupedUpPacket, fromSerial:false, timestamp: new Date().getTime()}), { binary: false });

        this.client.on('message', (topic, message, packet) => {
            let msg = JSON.parse(message.toString());
            if("id" in msg){
                for(let input of this.inputs){
                    if(input.id == msg.id){
                        input.onMessage(msg);
                        break;
                    }
                }
            }
            else{
                this.udp.onMessage(msg);
            }
        });
        return true;
    }

    disconnect(){
        if(this.client){
            this.client.unsubscribe("teleplot");
            this.client.end();
            this.client = null;
        }
    }

    sendServerCommand(command){
        if(this.client) this.client.publish("teleplot-command",JSON.stringify(command));
    }

    updateCMDList(){
        for(let input of this.inputs){
            input.updateCMDList();
        }
    }

    createInput(type) {
        if(type=="serial") {
            let serialIn = new DataInputSerial(this, "Serial");
            this.inputs.push(serialIn);
        }
    }
}