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


    }

    private tick() {
        let speed = .3;
        this.player.y -= speed;

        if (this.touchDown) {
            if (this.touchPosition.x < this.gameLayer.canvas.width / 2) {
                this.player.x -= speed;
            } else if (this.touchPosition.x > this.gameLayer.canvas.width / 2) {
                this.player.x += speed;
            }

        }
    }

    player: { x: number; y: number };

    private draw() {
        let scaleX = (this.gameLayer.canvas.width / 64);
        let scaleY = (this.gameLayer.canvas.height / 64);

        let context = this.gameLayer.context;
        context.save();
        context.fillStyle = 'rgba(0,0,0,.5)';
        context.fillRect(0, 0, this.gameLayer.canvas.width, this.gameLayer.canvas.height);


        context.translate(this.gameLayer.canvas.width / 2, this.gameLayer.canvas.height / 2);
        context.fillStyle = 'red';
        context.fillRect(0 - scaleX, 0 - scaleY, scaleX * 2, scaleY * 2);
        context.translate(-this.player.x * scaleX, -this.player.y * scaleY);
  /*             context.strokeStyle = 'grey';
 for (let x = -100; x < 100; x++) {
            context.strokeRect(x*64,0,2,100*64)
            context.strokeRect(0,x*64,100*64,2)
        }*/


        context.fillStyle = 'white';

        for (let element of this.getElements()) {
            context.fillRect(
                element.x * scaleX - scaleX / 2,
                element.y * scaleY - scaleY / 2,
                scaleX,
                scaleY
            );
        }
        context.restore();

    }

    * getElements(): Iterable<Element> {

        let px = Math.round(this.player.x);
        let py = Math.round(this.player.y);
        for (let x = px - 32; x < px + 32; x++) {
            for (let y = py - 32; y < py + 32; y++) {
                if (this.noise.simplex2(x, y) > .95) {
                    yield {x: x, y: y};
                }
            }
        }
    }
}

export class Element {
    x: number;
    y: number;
}