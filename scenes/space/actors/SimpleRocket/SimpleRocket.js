class SimpleRocket extends Phaser.GameObjects.Container {
    constructor(x, y, flavor) {
        var imgAspect = 1.455814;
        var lengthMin = 50;
        var lengthMax = 350;

        super(game, x, y);

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

        this.thrusters = [
            this.addThruster(this, -length*0.41, -width/2, 90, thrustScale), // Left
            this.addThruster(this, -length/2, 0, 0.01, thrustScale),         // Middle
            this.addThruster(this, -length*0.41, width/2, -90, thrustScale), // Right
        ];

        this.nextMotionPlanningUpdate = 0;
    }

    addThruster(container, x, y, angle, scale) {
        var thruster = new Thruster(x, y, angle, scale);
        container.add([thruster]);

        return thruster;
    }


    update(time, delta) {
        if (time > this.nextMotionPlanningUpdate) {
            this.thrusters.forEach(thruster => thruster.decideThrust());
            // Having both left and right thruster on is counter-intuitive,
            // so we force one of the two (at random) off.
            this.thrusters[Math.random() > 0.5 ? 0 : 2].setThrust(0);

            this.nextMotionPlanningUpdate = time + scaleBetween(100, 10000, this.scale);
        }
        this.angle += this.thrusters[2].thrust - this.thrusters[0].thrust;

        this.thrusters.forEach(thruster => thruster.update());
        var angleRad = this.angle * degToRadian;
        this.speedX += Math.cos(angleRad) * this.thrusters[1].thrust;
        this.speedY += Math.sin(angleRad) * this.thrusters[1].thrust;
        this.body.setVelocityX(this.speedX);
        this.body.setVelocityY(this.speedY);
    }
}

ScActorManager.registerActor('SimpleRocket', SimpleRocket);
