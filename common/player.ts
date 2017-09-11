import {Config} from "./config";
import {ServerTimeUtils} from "../server/app/serverBoard";

export type PlayerDirection = "left" | "right" | "none";
export type AttackType = "bullet" | "none";

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


export type PlayerAttackAction =
    { time: number; } &
    (
    {
        attack: AttackType;
        duration: number;
    }
    );

export class Player {
    playerId: string;
    shipType: string;
    playerName: string;

    private get timeNow(): number {
        return Config.isServer ? ServerTimeUtils.getNow() : ClientTimeUtils.getNow();
    }

    get x(): number {
        let now = this.timeNow;
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
                    let distance = Config.horizontalMoveSpeed * ((action.duration === 0 ? now - action.time : action.duration) / 1000 );
                    position = position + (distance * (action.moving === "left" ? -1 : 1));
                    break;
            }
        }
        return Math.round(position);
    }

    getXAtTime(now: number): number {
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
                    if (now < action.time) continue;
                    let time = 0;
                    if (action.duration === 0) {
                        time = now - action.time;
                    } else {
                        if (action.time + action.duration > now) {
                            time = now - action.time;
                        } else {
                            time = action.duration;
                        }
                    }

                    let distance = Config.horizontalMoveSpeed * (time / 1000 );
                    position = position + (distance * (action.moving === "left" ? -1 : 1));
                    break;
            }
        }
        return Math.round(position);
    }

    get y(): number {
        return this.getYAtTime(this.timeNow);
    }

    private getYAtTime(now: number) {
        return Math.round(Config.verticalMoveSpeed * ( now / 1000));
    }

    get lastMoveAction(): PlayerMoveAction {
        return this.moveActions[this.moveActions.length - 1];
    }

    protected moveActions: PlayerMoveAction[] = [];

    setMoveActions(actions: PlayerMoveAction[]) {
        this.moveActions = actions;
    }


    updateMoving(direction: PlayerDirection, time: number) {
        switch (this.lastMoveAction.moving) {
            case "left":
            case "right":
                this.lastMoveAction.duration = time - this.lastMoveAction.time;
                break;
        }

        this.moveActions.push({moving: direction, time: time, duration: 0});
        // this.reconcileMoveActions();
    }


    reconcileMoveActions() {
        let position = 0;
        if (this.lastMoveAction.moving !== "none") return;

        let now = this.timeNow;

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


    get lastAttackAction(): PlayerAttackAction {
        return this.attackActions[this.attackActions.length - 1] || {attack: 'none'};
    }

    protected attackActions: PlayerAttackAction[] = [];

    setAttackActions(actions: PlayerAttackAction[]) {
        this.attackActions = actions;
    }

    updateAttack(attack: AttackType, time: number) {
        switch (this.lastAttackAction.attack) {
            case "bullet":
                this.lastAttackAction.duration = time - this.lastAttackAction.time;
                break;
        }

        this.attackActions.push({attack: attack, time: time, duration: 0});
    }

    * getAttacks(): Iterable<{ attack: AttackType; x: number; y: number }> {
        let now = this.timeNow;
        for (let i = this.attackActions.length - 1; i >= 0; i--) {
            let attack = this.attackActions[i];
            switch (attack.attack) {
                case "bullet":
                    let hit = false;
                    for (let time = attack.time; time < (attack.duration === 0 ? now : attack.time + attack.duration); time += 1000 / this.bulletsPerSecond) {
                        let bulletDistance = Math.round(((now - time) / 1000) * this.bulletVelocityPerSecond);
                        if (Math.abs(bulletDistance) < 1500) {
                            hit = true;
                            yield {attack: attack.attack, x: this.getXAtTime(time), y: this.getYAtTime(time) + bulletDistance};
                        }
                    }
                    if (!hit) {
                        this.attackActions.splice(i, 1);
                    }
                    break;
            }
        }
        let empty = true;
        for (let i = this.attackActions.length - 1; i >= 0; i--) {
            let attack = this.attackActions[i];
            if (attack.attack !== "none") {
                empty = false;
                break;
            }
        }
        if (empty) {
            this.attackActions.length = 0;
        }
    }


    health: number;


    bulletsPerSecond: number = 7;
    bulletVelocityPerSecond: number = -800;


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