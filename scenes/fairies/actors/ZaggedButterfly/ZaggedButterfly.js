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
        super('ZaggedButterfly', flavor, x, y, minWidthRef, maxWidthRef, body);
    }
}

ScActorManager.registerActor('ZaggedButterfly', ZaggedButterfly);
