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
        const wiggleX = 4;
        const wiggleY = 4;
        const wiggleAngle = 10;
        const minFlapCycleLength = 180;
        const maxFlapCycleLength = 220;
        super('TailedButterfly', flavor, x, y, minWidthRef, maxWidthRef, body,
              wiggleX, wiggleY, wiggleAngle,
              minFlapCycleLength, maxFlapCycleLength);
    }
}

ScActorManager.registerActor(TailedButterfly);
