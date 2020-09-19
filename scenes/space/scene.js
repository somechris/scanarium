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
