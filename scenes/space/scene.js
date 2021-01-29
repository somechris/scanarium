// Scene: space

function scene_preload()
{
    game.load.spritesheet('spaceship-thrust', scene_dir + '/spaceship-thrust.png', { frameWidth: 600, frameHeight: 200 });
}

function scene_create()
{
    game.anims.create({
        key: 'spaceship-thrust-fire',
        frames: game.anims.generateFrameNumbers('spaceship-thrust', { start: 0, end: 2 }),
        frameRate: 60,
        repeat: -1
    });
}

function scene_update(time, delta) {
}

class Thruster extends Phaser.Physics.Arcade.Sprite {
    constructor(xCorr, yCorr, angleCorr, scale) {
        super(game, xCorr, yCorr, 'spaceship-thrust');
        this.setOrigin(1,0.5);
        this.visible = false;
        this.anims.play('spaceship-thrust-fire');
        this.angle = angleCorr;
        this.fullThrustWidth = 200 * scale;
        this.fullThrustLength = 600 * scale;
        this.thrust = 0;
        game.physics.world.enableBody(this);
        game.sys.updateList.add(this);
    }

    decideThrust() {
        this.setThrust(Math.max(Math.random() * 2 - 1, 0));
    }

    setThrust(thrust) {
        this.thrust = thrust;
    }

    update() {
        var visible = this.thrust > 0;
        this.setVisible(visible);
        if (visible) {
          // Setting sizes to 0 confuses Phaser and gets us NaN in a few places
          // and effectively prohibits the thruster to be shown. So we only
          // update sizes, if the thruster is visible (and hence does not have
          // size 0).
          var width = this.fullThrustLength * this.thrust;
          var height = this.fullThrustWidth * (this.thrust * 0.4 + 0.6);
          this.setDisplaySize(width, height);
          this.setSize(width, height);
        }
    }
}

class SpaceshipBase extends Phaser.GameObjects.Container {
    constructor(actor, flavor, x, y, angle, widthMin, widthMax) {
        super(game, x, y);

        this.thrusters = [];
        this.nextMotionPlanningUpdate = 0;

        this.base_scale = Math.pow(Math.random(), 5);

        var ship = game.add.image(0, 0, actor + '-' + flavor);
        var width = scaleBetween(widthMin, widthMax, this.base_scale);
        var height = ship.height / ship.width * width;
        ship.setSize(width, height);
        ship.setDisplaySize(width, height);
        ship.angle = angle;
        this.destroyOffset = 2 * (width + height);
        this.add([ship]);
        this.ship = ship;

        game.physics.world.enable(this);

        var speed = Math.random() * 40;
        var angle = Math.random() * 2 * Math.PI;
        this.speedX = Math.cos(angle) * speed
        this.speedY = Math.sin(angle) * speed
        this.angle = Math.random() * 360
        this.body.setVelocityX(this.speedX);
        this.body.setVelocityY(this.speedY);
    }

    addThruster(xFactor, yFactor, angle, scale, angularFactor, accelerationFactor) {
        var xPreRot = xFactor * this.ship.width / 2;
        var yPreRot = yFactor * this.ship.height / 2;

        var angleRad = this.ship.angle * degToRadian;
        var x = Math.cos(angleRad) * xPreRot - Math.sin(angleRad) * yPreRot;
        var y = Math.sin(angleRad) * xPreRot + Math.cos(angleRad) * yPreRot;
        var thruster = new Thruster(x, y, this.ship.angle + angle, scale);
        thruster.angularFactor = angularFactor;
        thruster.accelerationFactor = accelerationFactor;
        this.add([thruster]);

        this.thrusters.push(thruster);
    }

    updateMotionPlan(time, delta) {
    }

    update(time, delta) {
        if (time > this.nextMotionPlanningUpdate) {
            this.thrusters.forEach(thruster => thruster.decideThrust());
            this.updateMotionPlan(time, delta);
            this.nextMotionPlanningUpdate = time + scaleBetween(100, 10000, this.base_scale);
        }

        var acceleration = 0;

        this.thrusters.forEach(thruster => {
            thruster.update()

            this.angle += thruster.angularFactor * thruster.thrust;
            acceleration += thruster.accelerationFactor * thruster.thrust;
        });

        var angleRad = this.angle * degToRadian;
        this.speedX += Math.cos(angleRad) * acceleration;
        this.speedY += Math.sin(angleRad) * acceleration;
        this.body.setVelocityX(this.speedX);
        this.body.setVelocityY(this.speedY);
    }
}
