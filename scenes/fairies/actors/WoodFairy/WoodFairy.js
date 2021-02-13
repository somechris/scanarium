class WoodFairy extends Creature {
    constructor(x, y, flavor) {
        const minWidthRef = 210;
        const maxWidthRef = 330;
        const body = {
          points: [
            [104, 0],
            [114, 50],
            [112, 59],
            [111, 67],
            [111, 78],
            [112, 82],
            [105, 93],
            [101, 101],
            [98, 109],
            [97, 116],
            [97, 126],
            [95, 130],
            [95, 261],
            [193, 261],
            [193, 126],
            [194, 119],
            [194, 102],
            [192, 93],
            [189, 84],
            [186, 76],
            [190, 65],
            [195, 52],
            [197, 46],
            [198, 40],
            [226, 0],
            ],
          centerY: 55,
          width: 296,
          height: 262,
        };
        super('WoodFairy', flavor, x, y, minWidthRef, maxWidthRef, body);
    }
}

ScActorManager.registerActor('WoodFairy', WoodFairy);
