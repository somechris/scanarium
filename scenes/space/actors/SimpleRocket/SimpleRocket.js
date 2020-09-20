class SimpleRocket extends SpaceshipBase {
    constructor(x, y, flavor) {
        var imgAspect = 1.455814;
        var lengthMin = 50;
        var lengthMax = 350;

        super(x, y);

        this.scale = Math.pow(Math.random(), 5);

        var length = scaleBetween(lengthMin, lengthMax, this.scale);
        var width = length / imgAspect;

        var ship = game.add.image(0, 0, 'SimpleRocket-' + flavor);
        ship.setSize(length, width);
        ship.setDisplaySize(length, width);
        ship.angle = 180;
        this.destroyOffset = 2 * (length + width);
        this.add([ship]);

        game.physics.world.enable(this);

        var speed = Math.random() * 40;
        var angle = Math.random() * 2 * Math.PI;
        this.speedX = Math.cos(angle) * speed
        this.speedY = Math.sin(angle) * speed
        this.angle = Math.random() * 360
        this.body.setVelocityX(this.speedX);
        this.body.setVelocityY(this.speedY);

        var thrustScale = scaleBetween(0.08, 0.7, this.scale);

        this.addThruster(-length*0.41, -width/2, 90, thrustScale); // Left
        this.addThruster(-length/2, 0, 0.01, thrustScale);         // Middle
        this.addThruster(-length*0.41, width/2, -90, thrustScale); // Right
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
