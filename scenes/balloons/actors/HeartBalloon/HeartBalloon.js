class HeartBalloon extends BaseBalloon {
    constructor(x, y, flavor) {
        var spec = {
            shreds : [
                {x: 53, y: 49, r: 45},
                {x: 160, y: 47, r: 45},
                {x: 102, y: 136, r: 30},
            ],
            width: 210,
            height: 213,
        };
        super(flavor, 160, x, y, spec);
    }
}

ScActorManager.registerActor(HeartBalloon);
