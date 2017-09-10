import * as React from 'react';
import {MouseEventHandler} from "react";
import {ClientBoard} from "../../game/clientBoard";
import {GameManager} from "../../game/gameManager";

export class GameBoard extends React.Component<{}, {}> {
    canvas: HTMLCanvasElement;
    touchPosition: { x: number, y: number; } | null;
    private gameManager: GameManager;

    constructor() {
        super();
        this.gameManager = GameManager.instance;
    }

    componentDidMount() {
        this.updateCanvas();
    }

    updateCanvas() {
        window.addEventListener("resize", () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        const ctx = this.canvas.getContext('2d')!;
        this.gameManager.board!.loadContext(this.canvas, ctx);
    }


    private onMouseDown(ev: React.MouseEvent<HTMLCanvasElement>) {
        this.touchPosition = {x: ev.clientX, y: ev.clientY};
        if (this.touchPosition.x - this.canvas.width / 2 < 0) {
            this.gameManager.board!.playerHoldingLeft(this.gameManager.board!.me, true);
        } else {
            this.gameManager.board!.playerHoldingRight(this.gameManager.board!.me, true);
        }
    }

    private onMouseUp() {
        this.touchPosition = null;
        this.gameManager.board!.me.holdingLeft = this.gameManager.board!.me.holdingRight = false;
    }

    private onMouseMove(ev: React.MouseEvent<HTMLCanvasElement>) {
        if (this.touchPosition) {
            this.touchPosition.x = ev.clientX;
            this.touchPosition.y = ev.clientY;
            if (this.touchPosition.x - this.canvas.width / 2 < 0) {
                this.gameManager.board!.playerHoldingLeft(this.gameManager.board!.me, true);
            } else {
                this.gameManager.board!.playerHoldingRight(this.gameManager.board!.me, true);
            }
        }
    }

    render() {
        return (
            <canvas
                ref={(canvas) => this.canvas = canvas!}
                onMouseDown={(ev) => this.onMouseDown(ev)}
                onMouseUp={(ev) => this.onMouseUp()}
                onMouseMove={(ev) => this.onMouseMove(ev)}
            >

            </canvas>
        );
    }

}
