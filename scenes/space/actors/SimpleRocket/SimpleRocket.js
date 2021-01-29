class SimpleRocket extends SpaceshipBase {
    constructor(x, y, flavor) {
        var lengthMin = 50;
        var lengthMax = 350;

        super('SimpleRocket', flavor, x, y, 180, lengthMin, lengthMax);

        var thrustScale = scaleBetween(0.08, 0.7, this.base_scale);

        this.addThruster(0.82, 1, -90, thrustScale, -1, 0); // Left
        this.addThruster(1, 0, 180, thrustScale, 0, 1);   // Middle
        this.addThruster(0.82, -1, 90, thrustScale, 1, 0); // Right
    }

    updateMotionPlan(time, delta) {
        // Having both left and right thruster on is counter-intuitive,
        // so we force one of the two (at random) off.
        this.thrusters[Math.random() > 0.5 ? 0 : 2].setThrust(0);
    }
}

ScActorManager.registerActor('SimpleRocket', SimpleRocket);
