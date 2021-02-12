class Butterfly extends Creature {
    constructor(x, y, flavor) {
        const minWidthRef = 125;
        const maxWidthRef = 200;
        const body = {
          points: [
            [50, 19],
            [105, 113],
            [105, 178],
            [119, 178],
            [119, 113],
            [172, 19],
            ],
          centerY: 106,
          width: 223,
          height: 238,
        };
        super('Butterfly', flavor, x, y, minWidthRef, maxWidthRef, body);
    }
}

ScActorManager.registerActor('Butterfly', Butterfly);
