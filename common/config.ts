class ConfigInstance {
    horizontalMoveSpeed: number = 280;
    verticalMoveSpeed: number = -100;
    isServer: boolean = typeof(window)==="undefined";
}

export let Config = new ConfigInstance();
