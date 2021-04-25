class UnicornBalloon extends BaseBalloon {
    constructor(x, y, flavor) {
        var spec = {
            shreds : [
                {x: 116, y: 116, r: 45},
                {x: 215, y: 166, r: 45},
                {x: 29, y: 157, r: 25},
            ],
            width: 108,
            height: 165,
        };
        super(flavor, 220, x, y, spec);
    }
}

ScActorManager.registerActor(UnicornBalloon);
