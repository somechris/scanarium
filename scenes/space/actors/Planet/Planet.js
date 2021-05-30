class Planet extends PlanetBase {
    constructor(x, y, flavor) {
        var lengthMin = 50;
        var lengthMax = 150;

        super(flavor, x, y, lengthMin, lengthMax);
    }
}

ScActorManager.registerActor(Planet);
