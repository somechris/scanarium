class DragonBalloon extends BaseBalloon {
    constructor(x, y, flavor) {
        super('DragonBalloon', flavor, 220, x, y)
    }
}

ScActorManager.registerActor('DragonBalloon', DragonBalloon);
