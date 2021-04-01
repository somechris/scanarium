class DragonBalloon extends BaseBalloon {
    constructor(x, y, flavor) {
        super(flavor, 220, x, y)
    }
}

ScActorManager.registerActor(DragonBalloon);
