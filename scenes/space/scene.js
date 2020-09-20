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

class Thruster {
    constructor(xCorr, yCorr, angleCorr, scale) {
        this.sprite = game.physics.add.sprite(xCorr, yCorr, 'spaceship-thrust');
        this.sprite.setOrigin(1,0.5);
        this.sprite.visible = false;
        this.sprite.anims.play('spaceship-thrust-fire');
        this.sprite.angle = angleCorr;
        this.fullThrustWidth = 200 * scale;
        this.fullThrustLength = 600 * scale;
        this.thrust = 0;
    }

    decideThrust() {
        this.setThrust(Math.max(Math.random() * 2 - 1, 0));
    }

    setThrust(thrust) {
        this.thrust = thrust;
    }

    update() {
        this.sprite.visible = this.thrust > 0;
        var width = this.fullThrustLength * this.thrust;
        var height = this.fullThrustWidth * (this.thrust * 0.4 + 0.6);
        this.sprite.setDisplaySize(width, height);
        this.sprite.setSize(width, height);
    }
}
