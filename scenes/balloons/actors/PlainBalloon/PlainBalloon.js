class PlainBalloon extends BaseBalloon {
    constructor(x, y, flavor) {
        super('PlainBalloon', flavor, x, y)
    }
}

ScActorManager.registerActor('PlainBalloon', PlainBalloon);
