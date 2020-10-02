// Scene: balloons

function scene_preload() {
}

function scene_create() {
}

class BaseBalloon extends Phaser.Physics.Arcade.Sprite {
    constructor(actor, flavor, x, y) {
        super(game, x, y, actor + '-' + flavor);
        game.physics.world.enable(this);
        var scale = scaleBetween(0.4, 1, Math.random());
        var width = this.width * scale;
        var height = this.height * scale;
        this.setDisplaySize(width, height);
        this.setSize(width, height);
        this.speedX = 0;
        this.speedY = -20;
    }

    update(time, delta) {
        this.setVelocityX(this.speedX);
        this.setVelocityY(this.speedY);
    }
}
