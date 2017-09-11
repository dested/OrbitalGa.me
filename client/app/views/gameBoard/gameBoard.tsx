///<reference path="../../../../common/player.ts"/>
import * as React from 'react';
import {GameManager} from "../../game/gameManager";
import {Config} from "@common/config";
import {MessageType} from "@common/messages";
import {borderStyle} from "glamor/utils";
import {AttackType} from "@common/player";

export default class GameBoard extends React.Component<{}, { variables: any }> {
    canvas: HTMLCanvasElement;
    touchPosition: { x: number, y: number; } | null;
    private gameManager: GameManager;

    constructor() {
        super();
        this.gameManager = GameManager.instance;
        this.gameManager.setDebugger((key: string, value: string) => {
            this.setVariable(key, value);
        });
        this.state = {
            variables: {}
        };
    }

    setVariable(key: string, value: string) {
        this.setState({
            variables: {
                ...this.state.variables,
                [key]: value
            }
        })
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


    private fireMissile() {
        let board = this.gameManager.board!;
        this.gameManager.network.sendMessage({
            type: MessageType.Attack,
            playerId: board.me.playerId,
            attackType: "bullet",
            duration: 0
        });
        board.meFireStart(board.me);
    }

    private stopFireMissile() {
        let board = this.gameManager.board!;
        let duration = +new Date() - board.me.firingStart!;

        this.gameManager.network.sendMessage({
            type: MessageType.Attack,
            playerId: board.me.playerId,
            attackType: "bullet",
            duration: duration
        });
        board.meFireStop(board.me);
    }

    private onMouseDown(ev: React.MouseEvent<HTMLCanvasElement>) {
        this.touchPosition = {x: ev.clientX, y: ev.clientY};
        let board = this.gameManager.board!;
        if (this.touchPosition.x - this.canvas.width / 2 < 0) {
            this.gameManager.network.sendMessage({
                type: MessageType.Move,
                moving: "left",
                playerId: board.me.playerId,
                duration: 0,
                x: board.me.x
            });
            board.meStartMove(board.me, "left");
        } else {
            this.gameManager.network.sendMessage({
                type: MessageType.Move,
                moving: "right",
                playerId: board.me.playerId,
                duration: 0,
                x: board.me.x
            });
            board.meStartMove(board.me, "right");
        }
    }

    private onMouseUp() {
        this.touchPosition = null;
        let board = this.gameManager.board!;
        if (board.me.moving !== "none") {
            let duration = +new Date() - board.me.movingStart!;
            board!.meMoveStop(board.me);
            this.gameManager.network.sendMessage({
                type: MessageType.Move,
                moving: "none",
                playerId: board.me.playerId,
                duration: duration,
                x: board.me.x
            });
        }
    }

    private onMouseMove(ev: React.MouseEvent<HTMLCanvasElement>) {
        let board = this.gameManager.board!;

        if (this.touchPosition) {
            this.touchPosition.x = ev.clientX;
            this.touchPosition.y = ev.clientY;
            if (this.touchPosition.x - this.canvas.width / 2 < 0) {
                if (board.me.moving !== "left") {

                    let duration = +new Date() - board.me.movingStart!;
                    board!.meMoveStop(board.me);
                    this.gameManager.network.sendMessage({
                        type: MessageType.Move,
                        moving: "none",
                        playerId: board.me.playerId,
                        duration: duration,
                        x: board.me.x
                    });

                    this.gameManager.network.sendMessage({
                        type: MessageType.Move,
                        moving: "left",
                        playerId: board.me.playerId,
                        duration: 0,
                        x: board.me.x
                    });
                    board.meStartMove(board.me, "left");
                }
            } else {
                if (board.me.moving !== "right") {
                    let duration = +new Date() - board.me.movingStart!;
                    board!.meMoveStop(board.me);
                    this.gameManager.network.sendMessage({
                        type: MessageType.Move,
                        moving: "none",
                        playerId: board.me.playerId,
                        duration: duration,
                        x: board.me.x
                    });
                    this.gameManager.network.sendMessage({
                        type: MessageType.Move,
                        moving: "right",
                        playerId: board.me.playerId,
                        duration: 0,
                        x: board.me.x
                    });
                    board.meStartMove(board.me, "right");
                }
            }
        }
    }

    render() {
        return (
            <div style={{userSelect: 'none'}}>
                <canvas
                    ref={(canvas) => this.canvas = canvas!}
                    onMouseDown={(ev) => this.onMouseDown(ev)}
                    onMouseUp={(ev) => this.onMouseUp()}
                    onMouseMove={(ev) => this.onMouseMove(ev)}
                >
                </canvas>

                <div onMouseDown={() => this.fireMissile()} onMouseUp={() => this.stopFireMissile()} style={{
                    position: 'absolute',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'column',
                    border: '10px #838161 solid',
                    borderRadius: 60,
                    right: 30,
                    bottom: 30,
                    width: 100,
                    height: 100,
                    background: '#831e0a',
                    color: 'white'
                }}>
                    <span style={{display: 'flex'}}>
                        FIRE
                    </span>
                </div>
                {/*
                <div onClick={()=>this.fireBomb()} style={{position: 'absolute',display:'flex',justifyContent:'center',alignItems:'center',flexDirection:'column',border:'10px #838161 solid', borderRadius:30, right: 15, bottom: 140, width: 50, height: 50, background: '#505b83', color: 'white'}}>
                    <span style={{display:'flex'}}>
                        BOMB
                    </span>
                </div>
*/}
                <div style={{position: 'absolute', right: 0, top: 0, width: 200, height: 200, background: '#831e0a', color: 'white'}}>
                    {
                        Object.keys(this.state.variables).map(key =>
                            (
                                <div>{key} = {this.state.variables[key]}</div>
                            )
                        )
                    }
                </div>
            </div>
        );
    }


}
