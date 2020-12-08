class HeartBalloon extends BaseBalloon {
    constructor(x, y, flavor) {
        super('HeartBalloon', flavor, x, y)
    }
}

ScActorManager.registerActor('HeartBalloon', HeartBalloon);
