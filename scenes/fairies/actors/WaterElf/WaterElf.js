class WaterElf extends Creature {
    constructor(x, y, flavor) {
        const minWidthRef = 231;
        const maxWidthRef = 350;
        const body = {
          points: [
            [109, 0],
            [161, 65],
            [155, 66],
            [151, 69],
            [149, 72],
            [147, 79],
            [145, 87],
            [142, 92],
            [126, 109],
            [126, 265],
            [202, 265],
            [202, 100],
            [193, 90],
            [191, 79],
            [190, 72],
            [189, 70],
            [187, 68],
            [184, 66],
            [174, 63],
            [212, 0],
            ],
          centerY: 74,
          width: 334,
          height: 265,
        };
        const wiggleX = 1;
        const wiggleY = 1;
        const wiggleAngle = 2;
        const minFlapCycleLength = 150;
        const maxFlapCycleLength = 190;
        super('WaterElf', flavor, x, y, minWidthRef, maxWidthRef, body,
              wiggleX, wiggleY, wiggleAngle,
              minFlapCycleLength, maxFlapCycleLength);
    }
}

ScActorManager.registerActor(WaterElf);
