import {Config} from "./config";
import {ServerTimeUtils} from "../server/app/serverBoard";

export type PlayerDirection = "left" | "right" | "none";
export type AttackType = "bullet" | "bomb";

export type PlayerMoveAction =
    { time: number; } &
    (
    {
        moving: PlayerDirection;
        duration: number;
    }
    |
    {
        moving: 'start';
        position: number;
    }
    );

export class Player {
    playerId: string;
    shipType: string;
    playerName: string;

    get lastMoveAction(): PlayerMoveAction {
        return this.moveActions[this.moveActions.length - 1];
    }

    protected moveActions: PlayerMoveAction[] = [];

    setActions(actions: PlayerMoveAction[]) {
        this.moveActions = actions;
    }

    get x(): number {
        let position = 0;
        for (let i = 0; i < this.moveActions.length; i++) {
            let action = this.moveActions[i];
            switch (action.moving) {
                case "start":
                    position = action.position;
                    break;
                case "none":
                    break;
                case "left":
                case "right":
                    let distance = Config.horizontalMoveSpeed * ((action.duration === 0 ? ClientTimeUtils.getNow() - action.time : action.duration) / 1000 );
                    position = position + (distance * (action.moving === "left" ? -1 : 1));
                    break;
            }
        }
        return Math.round(position);
    }

    get y(): number {
        return Math.round(Config.verticalMoveSpeed * ( ClientTimeUtils.getNow() / 1000));
    }

    updateMoving(direction: PlayerDirection, time: number) {
        switch (this.lastMoveAction.moving) {
            case "left":
            case "right":
                this.lastMoveAction.duration = time - this.lastMoveAction.time;
                break;
        }

        this.moveActions.push({moving: direction, time: time, duration: 0});
        this.reconcileMoveActions();
    }


    reconcileMoveActions() {
        let position = 0;
        if (this.lastMoveAction.moving !== "none") return;

        let now = Config.isServer ? ServerTimeUtils.getNow() : ClientTimeUtils.getNow();

        for (let i = 0; i < this.moveActions.length; i++) {
            let action = this.moveActions[i];
            switch (action.moving) {
                case "start":
                    position = action.position;
                    break;
                case "none":
                    break;
                case "left":
                case "right":
                    let distance = Config.horizontalMoveSpeed * ((action.duration === 0 ? now - action.time : action.duration) / 1000 );
                    position = position + (distance * (action.moving === "left" ? -1 : 1));
                    break;
            }
        }
        let newActions: PlayerMoveAction[] = [];
        newActions.push({moving: "start", time: 0, position: Math.round(position)});

        console.log(this.moveActions, newActions);

        this.moveActions = newActions;
    }

    health: number;

    firingStart?: number | null;
    bulletsFired?: number | null;


    bulletsPerSecond: number = 10;
    bulletVelocity: number = -300;


}


export class ClientTimeUtils {
    static nowServerOffset: number = 0;

    static setServerNow(time: number) {
        this.nowServerOffset = time - +new Date();
    }

    static getNow() {
        return +new Date() + this.nowServerOffset;
    }
}