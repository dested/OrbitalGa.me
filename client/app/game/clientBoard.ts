import {Board} from "@common/board";
import {Message, MessageUtils, SyncMessage, SyncPlayer, TickMessage} from "@common/messages";
import {Config} from "@common/config";
import {ClientPlayer} from "./clientPlayer";
import {INoise, noise} from "../perlin";
import {Player} from "@common/player";
import {AssetManager} from "../common/assetManager";

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

        let time = +new Date();
        let callback = () => {
            window.requestAnimationFrame(callback);
            let diff = (+new Date()) - time;
            time = +new Date();
            console.log(diff);
            this.clientTick(diff);
            this.draw(diff);
        };
        window.requestAnimationFrame(callback);
    }

    loadBoard(data: SyncMessage, currentTick: number) {
        this.currentTick = currentTick;
        for (let playerData of data.players) {
            let clientPlayer = this.newPlayer(playerData, currentTick);
            if (playerData.me) {
                clientPlayer.me = true;
                this.me = clientPlayer;
            }
        }
    }

    private newPlayer(playerData: SyncPlayer, currentTick: number) {
        let clientPlayer = new ClientPlayer();
        clientPlayer.playerId = playerData.playerId;
        clientPlayer.shipType = playerData.shipType;
        clientPlayer.x = clientPlayer.drawX = playerData.x;
        clientPlayer.drawY = currentTick * Config.verticalMoveSpeed;
        clientPlayer.moving = playerData.moving;
        clientPlayer.playerName = playerData.playerName;
        this.players.push(clientPlayer);
        return clientPlayer;
    }

    updateBoard(data: SyncMessage, currentTick: number) {
        this.currentTick = currentTick;
        let missingPlayers: ClientPlayer[] = [...this.players];
        for (let playerData of data.players) {
            let clientPlayer = this.players.find(a => a.playerId === playerData.playerId);
            if (clientPlayer) {
                clientPlayer.x = clientPlayer.drawX = playerData.x;
                clientPlayer.shipType = playerData.shipType;
                clientPlayer.drawY = currentTick * Config.verticalMoveSpeed;
                clientPlayer.moving = playerData.moving;
                missingPlayers.splice(missingPlayers.findIndex(a => a === clientPlayer), 1);
            } else {
                this.newPlayer(playerData, currentTick);
            }
        }
        for (let missingPlayer of missingPlayers) {
            this.players.splice(this.players.findIndex(a => a === missingPlayer), 1);
        }
    }

    private clientTick(msDiff:number) {
        let y = Config.verticalMoveSpeed * Config.ticksPerSecond / (1000/msDiff);
        for (let player of this.players) {
            player.drawY += y;
            if (player.moving === "left") {
                player.drawX -= Config.horizontalMoveSpeed * Config.ticksPerSecond / 60;
            }
            if (player.moving === "right") {
                player.drawX += Config.horizontalMoveSpeed * Config.ticksPerSecond / 60;
            }
        }
        this.view.follow(this.me);
    }

    processMessage(player: ClientPlayer, message: Message) {
        if (MessageUtils.isTickMessage(message)) {
            if (this.currentTick - message.tick > Config.ticksPerSecond) {
                // this.syncPlayer(player);
            }
            else if (message.tick - this.currentTick > 2) {
                // this.syncPlayer(player);
            } else {
                this.executeMessage(player, message);
            }
        } else {
            this.executeMessage(player, message);
        }
    }


    private draw(msDiff:number) {
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
            context.drawImage(ship.image, player.drawX - ship.size.width / 2, player.drawY - ship.size.height / 2);
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


    follow({drawX, drawY}: { drawX: number, drawY: number }) {
        this.x = Math.round(drawX - this.width / 2);
        this.y = Math.round(drawY - this.height / 4 * 3);
    }
}

export class Star {
    x: number;
    y: number;
    n: number;
}