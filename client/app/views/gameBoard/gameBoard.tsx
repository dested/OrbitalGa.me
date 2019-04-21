///<reference path="../../../../common/player.ts"/>
import {MessageType} from '@common/messages';
import {ClientTimeUtils} from '@common/player';
import * as React from 'react';
import {GameManager} from '../../game/gameManager';

export default class GameBoard extends React.Component<{}, {variables: any}> {
  canvas: HTMLCanvasElement;
  touchPosition: {x: number; y: number} | null;
  private gameManager: GameManager;

  constructor(props: {}) {
    super(props);
    this.gameManager = GameManager.instance;
    this.gameManager.setDebugger((key: string, value: string) => {
      this.setVariable(key, value);
    });
    this.state = {
      variables: {},
    };
  }

  setVariable(key: string, value: string) {
    this.setState({
      variables: {
        ...this.state.variables,
        [key]: value,
      },
    });
  }

  componentDidMount() {
    this.updateCanvas();
  }

  updateCanvas() {
    window.addEventListener('resize', () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.gameManager.board!.view.width = window.innerWidth;
      this.gameManager.board!.view.height = window.innerHeight;
    });
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    const ctx = this.canvas.getContext('2d')!;
    this.gameManager.board!.loadContext(this.canvas, ctx);
  }

  private fireBullet() {
    const now = ClientTimeUtils.getNow();
    const board = this.gameManager.board!;
    const lastAttack = board.me.lastAttackAction.attack;

    if (lastAttack !== 'none') {
      this.gameManager.network.sendMessage({
        type: MessageType.Attack,
        attackType: 'none',
        playerId: board.me.playerId,
        time: now,
      });
      board.me.updateAttack('none', now);
    }

    this.gameManager.network.sendMessage({
      type: MessageType.Attack,
      attackType: 'bullet',
      time: now,
      playerId: board.me.playerId,
    });
    board.me.updateAttack('bullet', now);
  }

  private stopFireBullet() {
    const now = ClientTimeUtils.getNow();
    const board = this.gameManager.board!;
    this.gameManager.network.sendMessage({
      type: MessageType.Attack,
      attackType: 'none',
      playerId: board.me.playerId,
      time: now,
    });
    board.me.updateAttack('none', now);
  }

  private onTouchDown(ev: {x: number; y: number}) {
    this.touchPosition = {x: ev.x, y: ev.x};
    const board = this.gameManager.board!;
    const now = ClientTimeUtils.getNow();
    const lastMoving = board.me.lastMoveAction.moving;

    if (lastMoving !== 'none' && lastMoving !== 'start') {
      this.sendNone(now);
    }

    if (this.touchPosition.x - this.canvas.width / 2 < 0) {
      this.sendLeft(now);
    } else {
      this.sendRight(now);
    }
  }

  private onTouchUp() {
    this.touchPosition = null;
    this.sendNone(ClientTimeUtils.getNow());
  }

  private onTouchMove(ev: {x: number; y: number}) {
    const board = this.gameManager.board!;
    const now = ClientTimeUtils.getNow();
    if (this.touchPosition) {
      this.touchPosition.x = ev.x;
      this.touchPosition.y = ev.y;
      const lastAction = board.me.lastMoveAction;

      if (this.touchPosition.x - this.canvas.width / 2 < 0) {
        if (lastAction.moving !== 'left') {
          this.sendNone(now);
          this.sendLeft(now);
        }
      } else {
        if (lastAction.moving !== 'right') {
          this.sendNone(now);
          this.sendRight(now);
        }
      }
    }
  }

  private sendNone(now: number) {
    now = now || ClientTimeUtils.getNow();
    const board = this.gameManager.board!;
    board.me.updateMoving('none', now);
    this.gameManager.network.sendMessage({
      type: MessageType.Move,
      moving: 'none',
      playerId: board.me.playerId,
      time: now,
    });
  }

  private sendLeft(now: number) {
    const board = this.gameManager.board!;
    this.gameManager.network.sendMessage({
      type: MessageType.Move,
      moving: 'left',
      playerId: board.me.playerId,
      time: now,
    });
    board.me.updateMoving('left', now);
  }

  private sendRight(now: number) {
    const board = this.gameManager.board!;
    this.gameManager.network.sendMessage({
      type: MessageType.Move,
      moving: 'right',
      playerId: board.me.playerId,
      time: now,
    });
    board.me.updateMoving('right', now);
  }

  render() {
    return (
      <div style={{userSelect: 'none'}}>
        <canvas
          ref={canvas => (this.canvas = canvas!)}
          onMouseDown={ev => this.onTouchDown({x: ev.clientX, y: ev.clientY})}
          onMouseUp={ev => this.onTouchUp()}
          onMouseMove={ev => this.onTouchMove({x: ev.clientX, y: ev.clientY})}
          onTouchStart={ev => this.onTouchDown({x: ev.touches[0].clientX, y: ev.touches[0].clientY})}
          onTouchMove={ev => this.onTouchMove({x: ev.touches[0].clientX, y: ev.touches[0].clientY})}
          onTouchEnd={() => this.onTouchUp()}
        />

        <div
          onMouseDown={() => this.fireBullet()}
          onMouseUp={() => this.stopFireBullet()}
          onTouchStart={() => this.fireBullet()}
          onTouchEnd={() => this.stopFireBullet()}
          style={{
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
            color: 'white',
          }}
        >
          <span style={{display: 'flex'}}>FIRE</span>
        </div>
        {/*
                <div onClick={()=>this.fireBomb()} style={{position: 'absolute',display:'flex',justifyContent:'center',alignItems:'center',flexDirection:'column',border:'10px #838161 solid', borderRadius:30, right: 15, bottom: 140, width: 50, height: 50, background: '#505b83', color: 'white'}}>
                    <span style={{display:'flex'}}>
                        BOMB
                    </span>
                </div>
*/}
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: 200,
            height: 200,
            background: '#831e0a',
            color: 'white',
          }}
        >
          {Object.keys(this.state.variables).map(key => (
            <div>
              {key} = {this.state.variables[key]}
            </div>
          ))}
        </div>
      </div>
    );
  }
}
