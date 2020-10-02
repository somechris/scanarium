class Simple extends BaseBalloon {
    constructor(x, y, flavor) {
        super('Simple', flavor, x, y)
    }
}

ScActorManager.registerActor('Simple', Simple);
