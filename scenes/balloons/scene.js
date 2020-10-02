// Scene: balloons

function scene_preload() {
}

function scene_create() {
}

function scene_update(time, delta) {
}

class BaseBalloon extends Phaser.Physics.Arcade.Sprite {
    constructor(actor, flavor, x, y) {
        super(game, x, scanariumConfig.height + 2000, actor + '-' + flavor);
        game.physics.world.enable(this);
        this.depth = Math.random();
        var scale = scaleBetween(0.4, 1, this.depth);
        var width = this.width * scale;
        var height = this.height * scale;
        this.y = scanariumConfig.height + height + 10;
        this.setDisplaySize(width, height);
        this.setSize(width, height);
        this.speedX = 0;
        this.speedY = -20 * (1 + this.depth);
    }

    update(time, delta) {
        this.setVelocityX(this.speedX);
        this.setVelocityY(this.speedY);
    }
}
