class SimpleRocket {
    constructor(x, y, flavor) {
        var imgAspect = 1.455814;
        var lengthMin = 50;
        var lengthMax = 350;


        this.scale = Math.pow(Math.random(), 5);

        var length = scaleBetween(lengthMin, lengthMax, this.scale);
        var width = length / imgAspect;

        var container = game.add.container(x, y);
        this.container = container;

        var ship = game.add.image(0, 0, 'SimpleRocket-' + flavor);
        ship.setSize(length, width);
        ship.setDisplaySize(length, width);
        ship.angle = 180;
        this.destroyOffset = 2 * (length + width);
        this.container.add([ship]);

        game.physics.world.enable(this.container);

        var speed = Math.random() * 40;
        var angle = Math.random() * 2 * Math.PI;
        this.speedX = Math.cos(angle) * speed
        this.speedY = Math.sin(angle) * speed
        this.container.angle = Math.random() * 360
        this.container.body.setVelocityX(this.speedX);
        this.container.body.setVelocityY(this.speedY);

        var thrustScale = scaleBetween(0.08, 0.7, this.scale);

        this.thrusters = [
            this.addThruster(container, -length*0.41, -width/2, 90, thrustScale), // Left
            this.addThruster(container, -length/2, 0, 0.01, thrustScale),         // Middle
            this.addThruster(container, -length*0.41, width/2, -90, thrustScale), // Right
        ];

        this.nextMotionPlanningUpdate = 0;
    }

    addThruster(container, x, y, angle, scale) {
        var thruster = new Thruster(x, y, angle, scale);
        container.add([thruster.sprite]);

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
        this.container.angle += this.thrusters[2].thrust - this.thrusters[0].thrust;

        this.thrusters.forEach(thruster => thruster.update());
        var angleRad = this.container.angle * degToRadian;
        this.speedX += Math.cos(angleRad) * this.thrusters[1].thrust;
        this.speedY += Math.sin(angleRad) * this.thrusters[1].thrust;
        this.container.body.setVelocityX(this.speedX);
        this.container.body.setVelocityY(this.speedY);

        this.x = this.container.x;
        this.y = this.container.y;
    }

    destroy() {
            this.container.destroy();
    }
}

ScActorManager.registerActor('SimpleRocket', SimpleRocket);
