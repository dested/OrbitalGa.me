import {ClientGame} from "./client/clientGame";
import {Server} from "./server/server";


export class Start {
    static start() {
        let server = new Server();

        let clients: ClientGame[] = [];
        let contexts: CanvasRenderingContext2D[] = [];

        let canvas = document.createElement("canvas");
        canvas.style.border = 'solid 2px red';
        canvas.height = canvas.width = 500;
        contexts.push(canvas.getContext('2d')!);
        document.body.appendChild(canvas);

        for (let i = 0; i < 2; i++) {
            let client = new ClientGame();
            client.join();
            clients.push(client);
            let canvas = document.createElement("canvas");
            canvas.style.border = 'solid 2px white';
            canvas.height = canvas.width = 500;
            contexts.push(canvas.getContext('2d')!);
            document.body.appendChild(canvas)
        }

        false && setInterval(() => {
            let client = new ClientGame();
            client.join();
            clients.push(client);
            let canvas = document.createElement("canvas");
            canvas.style.border = 'solid 2px white';
            canvas.height = canvas.width = 500;
            contexts.push(canvas.getContext('2d')!);
            document.body.appendChild(canvas)
        }, Math.random() * 5000 + 1000);


        let lastTick = +new Date();
        setInterval(() => {
            let curTick = +new Date();
            for (let i = 0; i < clients.length; i++) {
                let client = clients[i];
                client.tick(curTick - lastTick)
            }
            lastTick = curTick;
        }, 16);
        setInterval(() => {

            contexts[0].clearRect(0, 0, 500, 500);
            server.game.debugDraw(contexts[0]);

            for (let i = 0; i < clients.length; i++) {
                let client = clients[i];
                contexts[i + 1].clearRect(0, 0, 500, 500);
                client.draw(contexts[i + 1]);
            }
        }, 16);
        let clientInd = 0;
        let runSim = false;

        document.onkeydown = (e) => {
            if (e.keyCode === 65) {
                clients[clientInd].liveEntity.pressShoot();
            }
            if (e.shiftKey) {
                runSim = !runSim;
                if (!runSim) {
                    for (let i = 0; i < clients.length; i++) {
                        let client = clients[i];
                        client.liveEntity.releaseLeft();
                        client.liveEntity.releaseRight();
                        client.liveEntity.releaseUp();
                        client.liveEntity.releaseDown();
                    }

                }
            }

            if (e.ctrlKey) {
                clientInd = (clientInd + 1) % clients.length;
            }
            if (e.keyCode === 38) {
                clients[clientInd].liveEntity.pressUp();
            } else if (e.keyCode === 40) {
                clients[clientInd].liveEntity.pressDown();
            } else if (e.keyCode === 37) {
                clients[clientInd].liveEntity.pressLeft();
            } else if (e.keyCode === 39) {
                clients[clientInd].liveEntity.pressRight();
            }
        };
        document.onkeyup = (e) => {
            if (e.keyCode === 65) {
                clients[clientInd].liveEntity.releaseShoot();
            }
            if (e.keyCode === 38) {
                clients[clientInd].liveEntity.releaseUp();
            } else if (e.keyCode === 40) {
                clients[clientInd].liveEntity.releaseDown();
            } else if (e.keyCode === 37) {
                clients[clientInd].liveEntity.releaseLeft();
            } else if (e.keyCode === 39) {
                clients[clientInd].liveEntity.releaseRight();
            }
        };

        setInterval(() => {
            if (!runSim) return;
            for (let i = 0; i < clients.length; i++) {
                let client = clients[i];

                if (Math.random() * 1000 < 50) {
                    if (client.liveEntity.pressingLeft)
                        client.liveEntity.releaseLeft();
                    else
                        client.liveEntity.pressLeft();
                } else {
                    if (Math.random() * 1000 < 50) {
                        if (client.liveEntity.pressingRight)
                            client.liveEntity.releaseRight();
                        else
                            client.liveEntity.pressRight();
                    }
                }
                if (Math.random() * 1000 < 50) {
                    if (client.liveEntity.pressingUp)
                        client.liveEntity.releaseUp();
                    else
                        client.liveEntity.pressUp();
                } else {
                    if (Math.random() * 1000 < 50) {
                        if (client.liveEntity.pressingDown)
                            client.liveEntity.releaseDown();
                        else
                            client.liveEntity.pressDown();
                    }
                }
            }
        }, 500);

    }
}



/*

collisions
firing bullets
firing bombs


*/