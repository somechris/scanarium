class Tit extends Bird {
    constructor(x, y, flavor) {
        const body = {
            wing: {
                shape: [
                    [0, 300],
                    [198, 409],
                    [450, 409],
                    [450, 0],
                    [100, 0],
                ],
                durations: {
                    glide: 100,
                    glideToUp: 50,
                    upToDown: 50,
                    downToGlide: 75,
                    downToUp: 100,
                },
                flapY: 409,
                flapAcceleration: [2000, 1000],
                glideScale: -0.1,
            },
            center: [86, 437],
            width: 690,
            height: 582,
        };
        super(flavor, 100, x, y, body, 0.4, 1, 550);
    }
}

ScActorManager.registerActor(Tit);
