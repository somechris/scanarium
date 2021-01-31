class PlainBalloon extends BaseBalloon {
    constructor(x, y, flavor) {
        super('PlainBalloon', flavor, 90, x, y)
    }
}

ScActorManager.registerActor('PlainBalloon', PlainBalloon);
