// Scene: fairies

function scene_preload() {
}

function scene_create() {
}

function scene_update(time, delta) {
}

class Creature extends Phaser.GameObjects.Container {
  constructor(actor, flavor, x, y, widthRef, bodySpec) {
    var x = scanariumConfig.width / 2;
    var y = scanariumConfig.height / 2;

    super(game, x, y);

    var flavored_actor = actor + '-' + flavor;

    var body = game.add.image(0, 0, flavored_actor);
    var width = widthRef * refToScreen;
    var base_scale = width / body.width;
    var height = body.height * base_scale;
    body.setOrigin(0.5, bodySpec.centerY / bodySpec.height);
    body.setSize(width, height);
    body.setDisplaySize(width, height);
    this.destroyOffset = Math.max(width, height);

    this.add(body);
    game.physics.world.enable(this);
  }
}
