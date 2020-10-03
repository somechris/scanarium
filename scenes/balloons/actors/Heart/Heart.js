class Heart extends BaseBalloon {
    constructor(x, y, flavor) {
        super('Heart', flavor, x, y)
    }
}

ScActorManager.registerActor('Heart', Heart);
