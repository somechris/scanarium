class TailedButterfly extends Creature {
    constructor(x, y, flavor) {
        const minWidthRef = 210;
        const maxWidthRef = 330;
        const body = {
          points: [
            [101, 0],
            [159, 83],
            [159, 155],
            [174, 155],
            [174, 83],
            [234, 0],
            ],
          centerY: 79,
          width: 334,
          height: 225,
        };
        super('TailedButterfly', flavor, x, y, minWidthRef, maxWidthRef, body);
    }
}

ScActorManager.registerActor('TailedButterfly', TailedButterfly);
