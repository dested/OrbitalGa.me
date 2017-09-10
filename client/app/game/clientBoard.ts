import {Board} from "@common/board";
import {Player} from "@common/player";
import {SyncMessage} from "@common/messages";
import {Config} from "@common/config";
import {ClientPlayer} from "./clientPlayer";
import {INoise, noise} from "../perlin";

export class ClientBoard extends Board {
    players: ClientPlayer[] = [];
    me: ClientPlayer;
    private noise: INoise = noise;
    private context: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;
    private view: View;

    loadContext(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
        this.canvas = canvas;
        this.context = context;

        this.view = new View();
        this.view.width = this.canvas.width;
        this.view.height = this.canvas.height;
        this.view.follow(this.me);

        let callback = () => {
            window.requestAnimationFrame(callback);
            this.clientTick();
            this.draw();
        };
        window.requestAnimationFrame(callback);
    }

    loadBoard(data: SyncMessage, currentTick: number) {
        this.currentTick = currentTick;
        for (let playerData of data.players) {
            let clientPlayer = new ClientPlayer();
            clientPlayer.y = currentTick * Config.verticalMoveSpeed;
            clientPlayer.x = playerData.x;
            clientPlayer.holdingLeft = playerData.holdingLeft;
            clientPlayer.holdingRight = playerData.holdingRight;
            clientPlayer.playerName = playerData.playerName;
            this.players.push(clientPlayer);
            if (playerData.me) {
                clientPlayer.me = true;
                this.me = clientPlayer;
            }
        }
    }

    private clientTick() {
        for (let player of this.players) {
            player.y += Config.verticalMoveSpeed * Config.ticksPerSecond / 60;
        }
        if (this.me.holdingLeft) {
            this.me.x -= Config.horizontalMoveSpeed * Config.ticksPerSecond / 60;
        }
        if (this.me.holdingRight) {
            this.me.x += Config.horizontalMoveSpeed * Config.ticksPerSecond / 60;
        }
        this.view.follow(this.me);
    }


    private draw() {
        let context = this.context;
        context.fillStyle = '#000000';
        context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        context.save();
        context.translate(-this.view.x, -this.view.y);

        context.fillStyle = 'white';

        for (let element of this.getStars()) {
            context.fillStyle = `rgba(255,255,255,${element.n / 2})`;
            context.fillRect(
                element.x  - 16 / 2,
                element.y- 16 / 2,
                16 * element.n,
                16 * element.n
            );
        }

        for (let player of this.players) {
            if (!player.me) {
                context.fillStyle = 'blue';
                context.fillRect(player.x - 40, player.y - 40, 40 * 2, 40 * 2);
            } else {
                context.fillStyle = 'red';
                context.fillRect(player.x - 50, player.y - 50, 50 * 2, 50 * 2);
            }
        }
        context.restore();

    }

    * getStars(): Iterable<Star> {
        for (let x = this.view.x; x < this.view.x + this.view.width; x+=64) {
            for (let y = this.view.y; y < this.view.y + this.view.height; y+=64) {
                let n = this.noise.simplex2(x, y);
                if (n < .4) {
                    yield {x, y, n: n};
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

    follow({x, y}: { x: number, y: number }) {
        this.x = x - this.width / 2;
        this.y = y - this.height / 4 * 3;
    }
}

export class Star {
    x: number;
    y: number;
    n: number;
}