import {Message} from "@common/messages";

export class Network {
    private socket: WebSocket;

    constructor(onJoin: () => void,
                onMessage: (message: Message) => void) {
        this.socket = new WebSocket('ws://localhost:7898');
        // this. socket = new WebSocket('ws://ec2-34-211-236-203.us-west-2.compute.amazonaws.com:7898');
        this.socket.binaryType = "arraybuffer";
        this.socket.onopen = () => {
            onJoin();
        };
        this.socket.onmessage = (m) => {
            onMessage(JSON.parse(m.data) as Message);
        };
    }

    sendMessage(message: Message) {
        this.socket.send(JSON.stringify(message));
    }
}