// Scene: space

function scene_preload(game)
{
    game.load.spritesheet('spaceship-thrust', scene_dir + '/spaceship-thrust.png', { frameWidth: 600, frameHeight: 200 });
}

var SpaceshipThrust = {
    game: null,
    spaceship: null,
    sprite: null,
    thrust: 0,

    init: function(game, spaceship, xCorr, yCorr, angleCorr, scale) {
        this.game = game;
        this.spaceship = spaceship;
        this.sprite = game.physics.add.sprite(xCorr, yCorr, 'spaceship-thrust');
        this.sprite.setOrigin(1,0.5);
        this.sprite.visible = false;
        this.sprite.anims.play('spaceship-thrust-fire');
        this.sprite.angle = angleCorr;
        this.fullThrustWidth = 200 * scale;
        this.fullThrustLength = 600 * scale;
        return this.sprite;
    },

    decideThrust: function() {
        this.setThrust(Math.max(Math.random() * 2 - 1, 0));
    },

    setThrust: function(thrust) {
        this.thrust = thrust;
    },

    update: function() {
        this.sprite.visible = this.thrust > 0;
        width = this.fullThrustLength * this.thrust;
        height = this.fullThrustWidth * (this.thrust * 0.4 + 0.6);
        this.sprite.setDisplaySize(width, height);
        this.sprite.setSize(width, height);
    },
};

var SimpleRocket = {
    game: null,
    sprite: null,
    imgAspect: 1.455814,
    angle: 180,
    speed: 10,
    lengthMin: 50,
    lengthMax: 350,
    nextMotionPlanningUpdate: 0,

    init: function(game, x, y, flavor) {
        this.game = game;

        this.scale = Math.pow(Math.random(), 5);

        this.length = scaleBetween(this.lengthMin, this.lengthMax, this.scale);
        this.width = this.length / this.imgAspect;

        var container = game.add.container(x, y);
        this.container = container;

        var ship = game.add.image(0, 0, 'SimpleRocket-' + flavor);
        ship.setSize(this.length, this.width);
        ship.setDisplaySize(this.length, this.width);
        ship.angle = 180;
        this.destroyOffset = 2 * (this.length + this.width);
        this.ship = ship;
        this.container.add([this.ship]);

        game.physics.world.enable(this.container);

        var speed = Math.random() * 40;
        var angle = Math.random() * 2 * Math.PI;
        this.speedX = Math.cos(angle) * speed
        this.speedY = Math.sin(angle) * speed
        this.container.angle = Math.random() * 360
        this.container.body.setVelocityX(this.speedX);
        this.container.body.setVelocityY(this.speedY);

        var thrustScale = scaleBetween(0.08, 0.7, this.scale);
        this.nozzleLeft = Object.create(SpaceshipThrust);
        this.container.add([this.nozzleLeft.init(this.game, this, -this.length*0.41, -this.width/2, 90, thrustScale)]);

        this.nozzleMiddle = Object.create(SpaceshipThrust);
        this.container.add([this.nozzleMiddle.init(this.game, this, -this.length/2, 0, 0.01, thrustScale)]);

        this.nozzleRight = Object.create(SpaceshipThrust);
        this.container.add([this.nozzleRight.init(this.game, this, -this.length*0.41, this.width/2, -90, thrustScale)]);

        this.nextMotionPlanningUpdate = 0;
    },

    update: function(time, delta) {
        if (time > this.nextMotionPlanningUpdate) {
            if (Math.random() > 0.5) {
                this.nozzleLeft.setThrust(0);
                this.nozzleRight.decideThrust();
            } else {
                this.nozzleLeft.decideThrust();
                this.nozzleRight.setThrust(0);
            }
            this.nozzleMiddle.decideThrust();

            this.nextMotionPlanningUpdate = time + scaleBetween(100, 10000, this.scale);
        }
        this.container.angle += this.nozzleRight.thrust - this.nozzleLeft.thrust;

        this.nozzleLeft.update();
        this.nozzleMiddle.update();
        this.nozzleRight.update();

        var angleRad = this.container.angle * degToRadian;
        this.speedX += Math.cos(angleRad) * this.nozzleMiddle.thrust;
        this.speedY += Math.sin(angleRad) * this.nozzleMiddle.thrust;
        this.container.body.setVelocityX(this.speedX);
        this.container.body.setVelocityY(this.speedY);

        this.x = this.container.x;
        this.y = this.container.y;
    },

    destroy: function() {
            this.container.destroy();
    },
};

ScActorManager.registerActor('SimpleRocket', SimpleRocket);
