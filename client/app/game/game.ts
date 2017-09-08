import {CanvasInformation} from "./common/canvasInformation";
import {INoise, noise} from "../perlin";

export class Game {
    noise: INoise;

    gameLayer: CanvasInformation;
    touchPosition: { x: number, y: number; };
    touchDown: boolean = false;

    constructor() {
        this.noise = noise;
        this.noise.seed(1234);
        this.gameLayer = CanvasInformation.create(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.gameLayer.canvas);
        window.addEventListener("resize", () => {
            this.gameLayer.canvas.width = window.innerWidth;
            this.gameLayer.canvas.height = window.innerHeight;
        });
        this.player = {x: 0, y: 0};

        this.gameLayer.canvas.onmousedown = (ev) => {
            this.touchDown = true;
            this.touchPosition = {x: ev.x, y: ev.y};
        };
        this.gameLayer.canvas.onmouseup = (ev) => {
            this.touchDown = false;
        };
        this.gameLayer.canvas.onmousemove = (ev) => {
            if (this.touchDown) {
                this.touchPosition = {x: ev.x, y: ev.y};
            }
        };

        let that = this;
        let callback = () => {
            window.requestAnimationFrame(callback);
            that.tick();
            that.draw();
        };
        window.requestAnimationFrame(callback);


        // this.player.y -= 20;
    }

    private tick() {

        if (this.touchDown) {
            this.player.x += (this.touchPosition.x - this.gameLayer.canvas.width / 2) / 1000;
            this.player.y += (this.touchPosition.y - this.gameLayer.canvas.height / 2) / 1000;
        }
    }

    player: { x: number; y: number };

    private draw() {
        let scaleX = (this.gameLayer.canvas.width / 64);
        let scaleY = (this.gameLayer.canvas.height / 64);

        let context = this.gameLayer.context;
        context.fillStyle = 'rgba(0,0,0,1)';
        context.fillRect(0, 0, this.gameLayer.canvas.width, this.gameLayer.canvas.height);

        context.save();


        context.translate(this.gameLayer.canvas.width / 2, this.gameLayer.canvas.height / 2);
        context.fillStyle = 'red';
        context.fillRect(0 - scaleX, 0 - scaleY, scaleX * 2, scaleY * 2);
        context.translate(-Math.round(this.player.x * scaleX), -Math.round(this.player.y * scaleY));

        context.fillStyle = 'white';

        for (let element of this.getElements()) {
            context.fillStyle = `rgba(255,255,255,${element.n})`;
            context.fillRect(
                element.x * scaleX - scaleX / 2,
                element.y * scaleY - scaleY / 2,
                scaleX * element.n,
                scaleY * element.n
            );

        }
        context.restore();

    }

    * getElements(): Iterable<Element> {
        let px = Math.round(this.player.x);
        let py = Math.round(this.player.y);
        for (let x = px - 32; x < px + 32; x++) {
            for (let y = py - 32; y < py + 32; y++) {
                let n = this.noise.simplex2(x, y);
                if (n > .85) {
                    yield {x, y, n};
                }
            }
        }
    }
}

export class Element {
    x: number;
    y: number;
    n: number;
}