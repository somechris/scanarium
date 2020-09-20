class FlyingSaucer extends SpaceshipBase {
    constructor(x, y, flavor) {
        var lengthMin = 50;
        var lengthMax = 350;

        super('FlyingSaucer', flavor, x, y, 90, lengthMin, lengthMax);

        var thrustScale = scaleBetween(0.06, 0.4, this.scale);

        this.addThruster(-0.75, 0.85, -72, thrustScale, 1, 0.2);   // Left
        this.addThruster(-0.25, 0.99, -87, thrustScale, 0.2, 0.7); // Middle-Left
        this.addThruster(0.25, 0.99, -96, thrustScale, -0.2, 0.7); // Middle-Right
        this.addThruster(0.75, 0.85, -108, thrustScale, -1, 0.2);  // Right
    }
}

ScActorManager.registerActor('FlyingSaucer', FlyingSaucer);
