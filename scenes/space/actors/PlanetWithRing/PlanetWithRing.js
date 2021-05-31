class PlanetWithRing extends PlanetBase {
    constructor(x, y, flavor) {
        var lengthMin = 107;
        var lengthMax = 320;

        super(flavor, x, y, lengthMin, lengthMax);

        // Resetting angular velocity, as it looks off, if the planet has a
        // ring.
        this.mainSprite.body.setAngularVelocity(0);
    }
}

ScActorManager.registerActor(PlanetWithRing);
