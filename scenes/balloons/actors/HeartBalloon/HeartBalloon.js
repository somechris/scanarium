class HeartBalloon extends BaseBalloon {
    constructor(x, y, flavor) {
        super('HeartBalloon', flavor, 160, x, y)
    }
}

ScActorManager.registerActor(HeartBalloon);
