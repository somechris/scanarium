// Scene: photos

function scene_preload()
{
    game.load.spritesheet('strips', scene_dir + '/strips.png', {frameWidth: 80, frameHeight: 240});
}

function scene_create()
{
}

function scene_update(time, delta) {
}

const STRIP_KINDS=5;
const STRIP_OVERLAYS=4;

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

        this.photo = photo;
        this.add(photo);

        this.addStrips();

        this.setPosition(scanariumConfig.width + width / 2 * 1.2, randomBetween(0, scanariumConfig.height - height));
        this.depth = -y;
        this.angle = randomBetween(-10, 10);
        this.destroyOffset = 2*width;

        game.physics.world.enableBody(this);

        this.body.setVelocityX(-30);
    }

    getStripDefinition() {
        return {
            kind: chooseInt(0, STRIP_KINDS - 1),
            overlay: chooseInt(0, STRIP_OVERLAYS - 1),
            alpha: randomBetween(0.5, 1),
            colors: [Math.random()*0xffffff, Math.random()*0xffffff],
        }
    }

    addStrip(relX, relY, angle) {
        var stripDefinition = this.stripDefinition;
        var stripNr = stripDefinition.kind;
        var strip = game.add.image(0, 0, 'strips', stripNr);
        const unscaled_width = strip.width;
        const width = 15 * 1.8 * refToScreen;
        const height = strip.height / strip.width * width;
        const x = relX * this.photo.width;
        const y = relY * this.photo.height
        angle += randomBetween(-10, 10) + (Math.random() < 0.99 ? 0 : 90);
        var that = this;
        var strips = [strip];
        if (stripDefinition.overlay > 0) {
            strips.push(game.add.image(0, 0, 'strips', stripNr + stripDefinition.overlay*STRIP_KINDS));
        }
        strips.forEach((sprite, index) => {
            sprite.setSize(width, height);
            sprite.setDisplaySize(width, height);
            sprite.setPosition(x, y);
            sprite.setTint(stripDefinition.colors[index]);
            sprite.angle = angle;
            sprite.alpha = stripDefinition.alpha;
            that.add(sprite);
        });
    }

    addStrips() {
        this.stripDefinition = this.getStripDefinition();
        switch (chooseInt(0, 2)) {
        case 0:
            // Only top
            this.addStrip(0, 0, 90);
            break;
        case 1:
            // Top and lower corners
            this.addStrip(0, 0, 90);
            this.addStrip(-0.5, 1, -45);
            this.addStrip(0.5, 1, 45);
            break;
        case 2:
            // All four corners
            this.addStrip(-0.5, 0, 45);
            this.addStrip(-0.5, 1, -45);
            this.addStrip(0.5, 0, -45);
            this.addStrip(0.5, 1, 45);
            break;
        }
    }

    update() {
    }
}
