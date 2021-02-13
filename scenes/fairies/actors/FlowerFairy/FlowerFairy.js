class FlowerFairy extends Creature {
    constructor(x, y, flavor) {
        const minWidthRef = 330;
        const maxWidthRef = 500;
        const body = {
          points: [
            [119, 0],
            [148, 70],
            [140, 71],
            [135, 74],
            [132, 77],
            [130, 81],
            [128, 87],
            [126, 94],
            [125, 100],
            [109, 134],
            [90, 159],
            [90, 263],
            [219, 263],
            [219, 159],
            [191, 99],
            [191, 93],
            [190, 88],
            [189, 83],
            [187, 78],
            [184, 74],
            [182, 72],
            [179, 70],
            [168, 69],
            [167, 65],
            [209, 0],
            ],
          centerY: 80,
          width: 314,
          height: 264,
        };
        const wiggleX = 1;
        const wiggleY = 1;
        const wiggleAngle = 2;
        const minFlapCycleLength = 150;
        const maxFlapCycleLength = 190;
        super('FlowerFairy', flavor, x, y, minWidthRef, maxWidthRef, body,
              wiggleX, wiggleY, wiggleAngle,
              minFlapCycleLength, maxFlapCycleLength);
    }
}

ScActorManager.registerActor('FlowerFairy', FlowerFairy);
