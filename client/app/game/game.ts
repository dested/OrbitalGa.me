import {CanvasInformation} from "./common/canvasInformation";
import {INoise, noise} from "../perlin";
import {Network} from "./network";
import {ClientBoard} from "./clientBoard";
import {Config} from "@common/config";
import {ClientPlayer} from "./clientPlayer";

export class Game {
    network: Network;
    board: ClientBoard;

    noise: INoise;
    gameLayer: CanvasInformation;


    constructor() {
        this.noise = noise;
        // this.network = new Network();
        this.board = new ClientBoard();
        this.board.createMainPlayer();

        this.noise.seed(1234);
        this.gameLayer = CanvasInformation.create(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.gameLayer.canvas);
        window.addEventListener("resize", () => {
            this.gameLayer.canvas.width = window.innerWidth;
            this.gameLayer.canvas.height = window.innerHeight;
        });
        let touchPosition: { x: number, y: number; };
        let touchDown: boolean = false;

        this.gameLayer.canvas.onmousedown = (ev) => {
            touchDown = true;
            touchPosition = {x: ev.x, y: ev.y};
            if (touchPosition.x - this.gameLayer.canvas.width / 2 < 0) {
                this.board.playerHoldingLeft(this.board.me, true);
            } else {
                this.board.playerHoldingRight(this.board.me, true);
            }
        };
        this.gameLayer.canvas.onmouseup = (ev) => {
            touchDown = false;
            this.board.me.holdingLeft = this.board.me.holdingRight = false;

        };
        this.gameLayer.canvas.onmousemove = (ev) => {
            if (touchDown) {
                touchPosition = {x: ev.x, y: ev.y};
                if (touchPosition.x - this.gameLayer.canvas.width / 2 < 0) {
                    this.board.playerHoldingLeft(this.board.me, true);
                } else {
                    this.board.playerHoldingRight(this.board.me, true);
                }
            }
        };

        let that = this;
        let callback = () => {
            window.requestAnimationFrame(callback);
            that.tick();
            that.draw();
        };
        window.requestAnimationFrame(callback);

    }

    private tick() {

        this.board.me.y -= Config.verticalMoveSpeed * Config.ticksPerSecond / 60;
        if (this.board.me.holdingLeft) {
            this.board.me.x -= Config.horizontalMoveSpeed * Config.ticksPerSecond / 60;
        }
        if (this.board.me.holdingRight) {
            this.board.me.x += Config.horizontalMoveSpeed * Config.ticksPerSecond / 60;
        }
    }

    private draw() {
        let scaleX = (this.gameLayer.canvas.width / 64);
        let scaleY = (this.gameLayer.canvas.height / 64);

        let context = this.gameLayer.context;
        context.fillStyle = '#000000';
        context.fillRect(0, 0, this.gameLayer.canvas.width, this.gameLayer.canvas.height);

        context.save();
        context.translate(this.gameLayer.canvas.width / 2, this.gameLayer.canvas.height / 4 * 3);

        context.save();
        context.translate(-Math.round(this.board.me.x * scaleX), -Math.round(this.board.me.y * scaleY));

        context.fillStyle = 'white';

        for (let element of this.getElements()) {
            context.fillStyle = `rgba(255,255,255,${element.n / 2})`;
            context.fillRect(
                element.x * scaleX - scaleX / 2,
                element.y * scaleY - scaleY / 2,
                scaleX * element.n,
                scaleX * element.n
            );
        }
        context.restore();

        context.fillStyle = 'blue';
        context.fillRect(0 - scaleX, 0 - scaleY, scaleX * 2, scaleX * 2);
        context.restore();
    }

    * getElements(): Iterable<Element> {
        let px = Math.round(this.board.me.x);
        let py = Math.round(this.board.me.y);
        for (let x = px - 32; x < px + 32; x++) {
            for (let y = py - 48; y < py + 16; y++) {
                let n = this.noise.simplex2(x, y) / 2;
                // if (n < .7) {
                yield {x, y, n};
                // }
            }
        }
    }
}

export class Element {
    x: number;
    y: number;
    n: number;
}