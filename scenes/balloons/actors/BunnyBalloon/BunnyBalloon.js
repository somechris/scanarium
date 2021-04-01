class BunnyBalloon extends BaseBalloon {
    constructor(x, y, flavor) {
        super(flavor, 100, x, y)
    }
}

ScActorManager.registerActor(BunnyBalloon);
