class DataInputMQTT extends DataInput{
    constructor(_connection, _name) {
        super(_connection, _name);
        this.type = "MQTT";
        // this.address = "";
        // this.port = UDPport;
    }

    connect(){
        console.log("DataInputMQTT connect")
    }
    disconnect(){
        console.log("DataInputMQTT disconnect")
    }

    onMessage(msg){
        console.log(`DataInputMQTT onMessage ${msg}`)

        if("data" in msg) {
            msg.input = this;
            parseData(msg);
        }
        else if("cmd" in msg) {
            //nope
        }
    }

    sendCommand(command){
        this.connection.sendServerCommand({ id: this.id, cmd: command});
    }

    updateCMDList(){
        this.sendCommand("|_telecmd_list_cmd|");
    }
}