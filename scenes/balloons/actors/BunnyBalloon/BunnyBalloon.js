class BunnyBalloon extends BaseBalloon {
    constructor(x, y, flavor) {
        super('BunnyBalloon', flavor, x, y)
    }
}

ScActorManager.registerActor('BunnyBalloon', BunnyBalloon);
