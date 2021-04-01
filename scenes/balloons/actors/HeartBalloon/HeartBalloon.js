class HeartBalloon extends BaseBalloon {
    constructor(x, y, flavor) {
        super(flavor, 160, x, y)
    }
}

ScActorManager.registerActor(HeartBalloon);
