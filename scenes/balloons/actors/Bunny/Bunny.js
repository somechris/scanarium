class Bunny extends BaseBalloon {
    constructor(x, y, flavor) {
        super('Bunny', flavor, x, y)
    }
}

ScActorManager.registerActor('Bunny', Bunny);
