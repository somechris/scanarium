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
        this.visible = this.thrust > 0;
        var width = this.fullThrustLength * this.thrust;
        var height = this.fullThrustWidth * (this.thrust * 0.4 + 0.6);
        this.setDisplaySize(width, height);
        this.setSize(width, height);
    }
}

class SpaceshipBase extends Phaser.GameObjects.Container {
    constructor(x, y) {
        super(game, x, y);

        this.thrusters = [];
        this.nextMotionPlanningUpdate = 0;
    }

    addThruster(x, y, angle, scale) {
        var thruster = new Thruster(x, y, angle, scale);
        this.add([thruster]);

        this.thrusters.push(thruster);
    }

    updateMotionPlan(time, delta) {
    }

    update(time, delta) {
        if (time > this.nextMotionPlanningUpdate) {
            this.thrusters.forEach(thruster => thruster.decideThrust());
            this.updateMotionPlan(time, delta);
            this.nextMotionPlanningUpdate = time + scaleBetween(100, 10000, this.scale);
        }
        this.thrusters.forEach(thruster => thruster.update());
    }
}
