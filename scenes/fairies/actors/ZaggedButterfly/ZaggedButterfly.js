class ZaggedButterfly extends Creature {
    constructor(x, y, flavor) {
        const minWidthRef = 210;
        const maxWidthRef = 330;
        const body = {
          points: [
            [114, 0],
            [178, 86],
            [178, 155],
            [192, 155],
            [192, 86],
            [248, 0],
            ],
          centerY: 79,
          width: 370,
          height: 196,
        };
        const wiggleX = 4;
        const wiggleY = 4;
        const wiggleAngle = 10;
        const minFlapCycleLength = 130;
        const maxFlapCycleLength = 170;
        super(flavor, x, y, minWidthRef, maxWidthRef, body,
              wiggleX, wiggleY, wiggleAngle,
              minFlapCycleLength, maxFlapCycleLength);
    }
}

ScActorManager.registerActor(ZaggedButterfly);
