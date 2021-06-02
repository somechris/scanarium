// Scene: space

function scene_preload()
{
    game.load.spritesheet('spaceship-thrust', scene_dir + '/spaceship-thrust.png', { frameWidth: 600, frameHeight: 300 });
}

function scene_create()
{
    game.anims.create({
        key: 'spaceship-thrust-fire',
        frames: game.anims.generateFrameNumbers('spaceship-thrust', { start: 0, end: 5 }),
        frameRate: 60,
        repeat: -1
    });
}

function scene_update(time, delta) {
}

class SpaceObject extends Phaser.GameObjects.Container {
    constructor(flavor, x, y, angle, widthMin, widthMax, frames, mainFrame) {
        super(game, x, y);

        const actor = this.constructor.name;
        const image_name = actor + '-' + flavor;

        if (frames) {
            this.createFrames(image_name, frames);
        }

        this.base_scale = Math.pow(Math.random(), 5);
        var mainSprite = game.add.image(0, 0, image_name, mainFrame);
        var width = scaleBetween(widthMin, widthMax, this.base_scale) * refToScreen;
        this.textureScaleFactor =  width / mainSprite.width;
        var height = mainSprite.height * this.textureScaleFactor;
        mainSprite.setSize(width, height);
        mainSprite.setDisplaySize(width, height);
        mainSprite.angle = angle;
        this.destroyOffset = 2 * (width + height);
        this.add([mainSprite]);
        this.mainSprite = mainSprite;

        game.physics.world.enable(this);
    }

    createFrames(image_name, frames) {
        if (game.textures.get(image_name).frameTotal == 1) {
            this.createFramesForce(image_name, frames);
        }
    }

    createFramesForce(image_name, frames) {
        const full_texture = game.textures.get(image_name);
        const full_texture_source_index = 0;
        const full_source = full_texture.source[full_texture_source_index];
        const xFactor = full_source.width / 100;
        const yFactor = full_source.height / 100;

        Object.keys(frames).forEach(key => {
            const conf = frames[key];
            full_texture.add(
                key, full_texture_source_index,
                conf.x * xFactor, conf.y * yFactor,
                conf.width * xFactor, conf.height * yFactor);
        });
    }

    update(time, delta) {
    }
}

class Thruster extends Phaser.Physics.Arcade.Sprite {
    constructor(xCorr, yCorr, angleCorr, scale) {
        super(game, xCorr, yCorr, 'spaceship-thrust');
        this.setOrigin(1,0.5);
        this.visible = false;
        this.anims.play('spaceship-thrust-fire');
        this.angle = angleCorr;
        this.fullThrustWidth = 300 * refToScreen * scale;
        this.fullThrustLength = 600 * refToScreen * scale;
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

class SpaceshipBase extends SpaceObject {
    constructor(flavor, x, y, angle, widthMin, widthMax) {
        super(flavor, x, y, angle, widthMin, widthMax);

        this.thrusters = [];
        this.nextMotionPlanningUpdate = 0;

        var speed = Math.random() * 40 * refToScreen;
        var angle = Math.random() * 2 * Math.PI;
        this.body.setVelocityX(Math.cos(angle) * speed);
        this.body.setVelocityY(Math.cos(angle) * speed);
        this.angle = Math.random() * 360;
    }

    addThruster(xFactor, yFactor, angle, scale, angularFactor, accelerationFactor) {
        var xPreRot = xFactor * this.mainSprite.width / 2;
        var yPreRot = yFactor * this.mainSprite.height / 2;

        var angleRad = this.mainSprite.angle * degToRadian;
        var x = Math.cos(angleRad) * xPreRot - Math.sin(angleRad) * yPreRot;
        var y = Math.sin(angleRad) * xPreRot + Math.cos(angleRad) * yPreRot;
        var thruster = new Thruster(x, y, this.mainSprite.angle + angle, scale);
        thruster.angularFactor = angularFactor;
        thruster.accelerationFactor = accelerationFactor;
        this.addAt(thruster, 0);

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

        var angularVelocity = 0;
        var acceleration = 0;

        this.thrusters.forEach(thruster => {
            thruster.update()

            angularVelocity += thruster.angularFactor * thruster.thrust * 60 * refToScreen;
            acceleration += thruster.accelerationFactor * thruster.thrust * 60 * refToScreen;
        });

        this.body.setAngularVelocity(angularVelocity);
        this.body.setAccelerationX(Math.cos(this.rotation) * acceleration)
        this.body.setAccelerationY(Math.sin(this.rotation) * acceleration)
    }
}

class PlanetBase extends SpaceObject {
    constructor(flavor, x, y, widthMin, widthMax, frames, mainFrame) {
        super(flavor, x, y, randomBetween(0, 360), widthMin, widthMax, frames, mainFrame);
        this.setDepth(-10);

        const startOffset = Math.random() * 2 * (scanariumConfig.width + scanariumConfig.height);
        if (startOffset < scanariumConfig.width) {
            this.setPosition(startOffset, -this.mainSprite.height/2);
        } else if (startOffset < scanariumConfig.width + scanariumConfig.height) {
            this.setPosition(scanariumConfig.width + this.mainSprite.width/2, startOffset - scanariumConfig.width);
        } else if (startOffset < 2*scanariumConfig.width + scanariumConfig.height) {
            this.setPosition(2*scanariumConfig.width + scanariumConfig.height - startOffset, scanariumConfig.height + this.mainSprite.height/2);
        } else {
            this.setPosition(-this.mainSprite.width/2, 2*scanariumConfig.width + 2 * scanariumConfig.height - startOffset);
        }
        const targetX = scanariumConfig.width * randomDeviationFactor(0.2) / 2;
        const targetY = scanariumConfig.height * randomDeviationFactor(0.2) / 2;
        const v = new Phaser.Math.Vector2(targetX - this.x, targetY - this.y);
        v.normalize();
        v.rotate(randomPlusMinus(0.3));
        v.scale((30 + randomPlusMinus(10)) * refToScreen);
        this.body.setVelocity(v.x, v.y);

        this.angularVelocityFactor = randomPlusMinus(0.05);

        game.physics.world.enable(this.mainSprite);
        this.mainSprite.body.setAngularVelocity(randomPlusMinus(7));
        this.angle = Math.random() * 360;
    }

    update(time, delta) {
        this.body.setAcceleration(this.body.velocity.y * this.angularVelocityFactor, -this.body.velocity.x * this.angularVelocityFactor);
    }

}
