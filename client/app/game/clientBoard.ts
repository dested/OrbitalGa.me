import {Board} from "@common/board";
import {Message, MessageType, SyncMessage, SyncPlayer} from "@common/messages";
import {ClientPlayer} from "./clientPlayer";
import {INoise, noise} from "../perlin";
import {AssetManager} from "../common/assetManager";
import {GameManager} from "./gameManager";

export class ClientBoard extends Board {


    players: ClientPlayer[] = [];
    me: ClientPlayer;
    private noise: INoise = noise;
    private context: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;
    view: View;

    loadContext(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
        this.canvas = canvas;
        this.context = context;

        this.view = new View();
        this.view.width = this.canvas.width;
        this.view.height = this.canvas.height;
        this.view.follow(this.me);

        let time = +new Date();
        let callback = () => {
            window.requestAnimationFrame(callback);
            let diff = (+new Date()) - time;
            time = +new Date();
            this.clientTick(diff);
            this.draw(diff);
        };
        window.requestAnimationFrame(callback);
    }

    loadBoard(data: SyncMessage) {
        for (let playerData of data.players) {
            let clientPlayer = this.newPlayer(playerData);
            if (playerData.me) {
                clientPlayer.me = true;
                this.me = clientPlayer;
            }
        }
    }

    private newPlayer(playerData: SyncPlayer) {
        let clientPlayer = new ClientPlayer();
        clientPlayer.playerId = playerData.playerId;
        clientPlayer.shipType = playerData.shipType;
        clientPlayer.setMoveActions(playerData.actions);
        clientPlayer.playerName = playerData.playerName;
        this.players.push(clientPlayer);
        return clientPlayer;
    }

    updateBoard(data: SyncMessage) {
        let missingPlayers: ClientPlayer[] = [...this.players];
        for (let playerData of data.players) {
            let clientPlayer = this.players.find(a => a.playerId === playerData.playerId);
            if (clientPlayer) {
                clientPlayer.shipType = playerData.shipType;
                clientPlayer.setMoveActions(playerData.actions);
                missingPlayers.splice(missingPlayers.findIndex(a => a === clientPlayer), 1);
            } else {
                this.newPlayer(playerData);
            }
        }
        for (let missingPlayer of missingPlayers) {
            this.players.splice(this.players.findIndex(a => a === missingPlayer), 1);
        }
    }

    private clientTick(msDiff: number) {
    }

    processMessage(player: ClientPlayer, message: Message) {
        console.log('executing message', player.playerName, message);
        switch (message.type) {
            case MessageType.Move:
                player.updateMoving(message.moving, message.time);
                break;
            case MessageType.Attack:
                player.updateAttack(message.attackType, message.time);
                break;
        }
    }


    private draw(msDiff: number) {
        this.view.follow(this.me);

        let context = this.context;
        context.fillStyle = '#000000';
        context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        context.save();
        context.translate(-this.view.x, -this.view.y);

        context.fillStyle = 'white';

        for (let element of this.getStars()) {
            context.fillStyle = `rgba(255,255,255,${element.n / 2})`;
            context.fillRect(
                element.x,
                element.y,
                16 * element.n,
                16 * element.n
            );
        }


        for (let player of this.players) {
            let ship = AssetManager.assets[player.shipType];
            GameManager.instance.debugValue(player.playerId + "-x", player.x);
            GameManager.instance.debugValue(player.playerId + "-y", player.y);
            context.drawImage(ship.image, player.x - ship.size.width / 2, player.y - ship.size.height / 2);
            for (let element of player.getAttacks()) {
                context.fillStyle = `rgba(255,240,76,.7)`;
                context.fillRect(
                    element.x - 4,
                    element.y - 8,
                    8,
                    16
                );
            }
        }
        context.restore();

    }

    * getStars(): Iterable<Star> {
        let starX = this.view.starX;
        let starW = starX + this.view.starWidth;
        let starY = this.view.starY;
        let starH = starY + this.view.starHeight;

        for (let x = starX; x < starW + 2; x += 1) {
            for (let y = starY; y < starH + 2; y += 1) {
                let n = this.noise.simplex2(x, y);
                if (n < 1) {
                    yield {x: x * 16, y: y * 16, n: n};
                }
            }
        }
    }

}

export class View {
    x: number;
    y: number;
    width: number;
    height: number;

    get starX(): number {
        return Math.round(this.x / 16);
    }

    get starY(): number {
        return Math.round(this.y / 16);
    }

    get starWidth(): number {
        return Math.round(this.width / 16);
    }

    get starHeight(): number {
        return Math.round(this.height / 16);
    }


    follow({x, y}: { x: number, y: number }) {
        this.x = Math.round(x - this.width / 2);
        this.y = Math.round(y - this.height / 4 * 3);
    }
}

export class Star {
    x: number;
    y: number;
    n: number;
}