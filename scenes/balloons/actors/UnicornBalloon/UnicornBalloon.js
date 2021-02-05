class UnicornBalloon extends BaseBalloon {
    constructor(x, y, flavor) {
        super('UnicornBalloon', flavor, 220, x, y)
    }
}

ScActorManager.registerActor('UnicornBalloon', UnicornBalloon);
