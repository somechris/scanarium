class PlainBalloon extends BaseBalloon {
    constructor(x, y, flavor) {
        super(flavor, 90, x, y)
    }
}

ScActorManager.registerActor(PlainBalloon);
