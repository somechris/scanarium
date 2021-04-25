class DragonBalloon extends BaseBalloon {
    constructor(x, y, flavor) {
        var spec = {
            shreds : [
                {x: 90, y: 59, r: 25},
                {x: 135, y: 168, r: 25},
                {x: 50, y: 151, r: 25},
                {x: 87, y: 126, r: 30},
            ],
            width: 206,
            height: 226,
        };
        super(flavor, 220, x, y, spec);
    }
}

ScActorManager.registerActor(DragonBalloon);
