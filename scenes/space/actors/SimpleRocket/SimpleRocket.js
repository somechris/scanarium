class SimpleRocket extends SpaceshipBase {
    constructor(x, y, flavor) {
        var lengthMin = 50;
        var lengthMax = 350;

        super('SimpleRocket', flavor, x, y, 180, lengthMin, lengthMax);

        var thrustScale = scaleBetween(0.08, 0.7, this.scale);

        this.addThruster(-0.82, -1, 90, thrustScale); // Left
        this.addThruster(-1, 0, 0.01, thrustScale);   // Middle
        this.addThruster(-0.82, 1, -90, thrustScale); // Right
    }

    updateMotionPlan(time, delta) {
        // Having both left and right thruster on is counter-intuitive,
        // so we force one of the two (at random) off.
        this.thrusters[Math.random() > 0.5 ? 0 : 2].setThrust(0);
    }

    update(time, delta) {
        super.update(time, delta);
        this.angle += this.thrusters[2].thrust - this.thrusters[0].thrust;

        var angleRad = this.angle * degToRadian;
        this.speedX += Math.cos(angleRad) * this.thrusters[1].thrust;
        this.speedY += Math.sin(angleRad) * this.thrusters[1].thrust;
        this.body.setVelocityX(this.speedX);
        this.body.setVelocityY(this.speedY);
    }
}

ScActorManager.registerActor('SimpleRocket', SimpleRocket);
