class OldFamilyCar extends Vehicle {
    constructor(x, y, flavor) {
        super('OldFamilyCar', flavor, x, y, 500);
    }
}

ScActorManager.registerActor('OldFamilyCar', OldFamilyCar);
