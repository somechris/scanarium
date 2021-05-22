// Scene: photos

function scene_preload()
{
}

function scene_create()
{
}

function scene_update(time, delta) {
}

class Photo extends Phaser.GameObjects.Container {
    /* flavor - actor's flavor
       x - desired initial x position
       y - desired initial y position
       widthMm - The actor's reference width in mm
    */
    constructor(flavor, x, y, widthMm) {
        super(game, x, y);

        const actor = this.constructor.name;
        const texture_name = actor + '-' + flavor;

        var photo = game.add.image(0, 0, texture_name);
        const photo_unscaled_width = photo.width;
        const photo_unscaled_height = photo.height;
        const width = widthMm * 1.8 * refToScreen;
        const height = photo_unscaled_height / photo_unscaled_width * width;

        photo.setOrigin(0.5, 0);
        photo.setSize(width, height);
        photo.setDisplaySize(width, height);

        this.add(photo);

        this.setPosition(scanariumConfig.width + width / 2 * 1.2, randomBetween(0, scanariumConfig.height - height));
        this.depth = -y;
        this.angle = randomBetween(-10, 10);
        this.destroyOffset = 2*width;

        game.physics.world.enableBody(this);

        this.body.setVelocityX(-30);
    }

    update() {
    }
}
