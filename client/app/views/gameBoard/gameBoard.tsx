import * as React from 'react';
import {GameManager} from "../../game/gameManager";
import {Config} from "@common/config";
import {MessageType} from "@common/messages";

export default class GameBoard extends React.Component<{}, {}> {
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

        setInterval(() => {
            this.gameManager.board!.tick();
        }, 1000 / Config.ticksPerSecond);
    }


    private onMouseDown(ev: React.MouseEvent<HTMLCanvasElement>) {
        this.touchPosition = {x: ev.clientX, y: ev.clientY};
        let board = this.gameManager.board!;
        if (this.touchPosition.x - this.canvas.width / 2 < 0) {
            if (board.me.moving !== "left") {
                this.gameManager.network.sendMessage({
                    type: MessageType.Move,
                    moving: "left",
                    playerId: board.me.playerId,
                    tick: board.currentTick
                });
            }
            board.playerMove(board.me, "left");
        } else {
            if (board.me.moving !== "right") {
                this.gameManager.network.sendMessage({
                    type: MessageType.Move,
                    moving: "right",
                    playerId: board.me.playerId,
                    tick: board.currentTick
                });
            }

            board.playerMove(board.me, "right");
        }
    }

    private onMouseUp() {
        this.touchPosition = null;
        let board = this.gameManager.board!;
        if (board.me.moving !== "none") {
            this.gameManager.network.sendMessage({
                type: MessageType.Move,
                moving: "none",
                playerId: board.me.playerId,
                tick: board.currentTick
            });
        }
        board!.playerMove(board.me, "none");
    }

    private onMouseMove(ev: React.MouseEvent<HTMLCanvasElement>) {
        let board = this.gameManager.board!;

        if (this.touchPosition) {
            this.touchPosition.x = ev.clientX;
            this.touchPosition.y = ev.clientY;
            if (this.touchPosition.x - this.canvas.width / 2 < 0) {
                if (board.me.moving !== "left") {
                    this.gameManager.network.sendMessage({
                        type: MessageType.Move,
                        moving: "left",
                        playerId: board.me.playerId,
                        tick: board.currentTick
                    });
                }
                board.playerMove(board.me, "left");
            } else {
                if (board.me.moving !== "right") {
                    this.gameManager.network.sendMessage({
                        type: MessageType.Move,
                        moving: "right",
                        playerId: board.me.playerId,
                        tick: board.currentTick
                    });
                }
                board.playerMove(board.me, "right");
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
