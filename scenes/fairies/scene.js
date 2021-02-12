// Scene: fairies

function scene_preload() {
}

function scene_create() {
}

function scene_update(time, delta) {
}

class Wings extends Phaser.Physics.Arcade.Sprite {
  constructor(x, y, image_name, body) {
    super(game, x, y, image_name);

    game.physics.world.enableBody(this);
    game.sys.updateList.add(this);

    this.x = body.x;
    this.y = body.y;
    this.fullWidth = body.width;
    this.fullHeight = body.height;
    this.setOrigin(body.originX, body.originY);
    this.setSize(this.fullWidth, this.fullHeight);
    this.setDisplaySize(this.fullWidth, this.fullHeight);
  }
}

class Creature extends Phaser.GameObjects.Container {
  constructor(actor, flavor, x, y, widthRef, bodySpec) {
    var x = scanariumConfig.width / 2;
    var y = scanariumConfig.height / 2;

    super(game, x, y);

    var flavored_actor = actor + '-' + flavor;
    this.createTextures(flavored_actor, bodySpec);

    var body = game.add.image(0, 0, flavored_actor + '-body');
    var width = widthRef * refToScreen;
    var base_scale = width / body.width;
    var height = body.height * base_scale;
    body.setOrigin(0.5, bodySpec.centerY / bodySpec.height);
    body.setSize(width, height);
    body.setDisplaySize(width, height);
    this.destroyOffset = Math.max(width, height);

    var wings = new Wings(x, y, flavored_actor + '-wings', body);
    this.add(wings);
    this.wings = wings;

    this.add(body);
    game.physics.world.enable(this);
  }

  createTextures(flavored_actor, bodySpec) {
    if (!game.textures.exists(flavored_actor + '-body')) {
      this.createTexturesForce(flavored_actor, bodySpec);
    }
  }

  createTexturesForce(flavored_actor, bodySpec) {
    const full_texture = game.textures.get(flavored_actor);
    const full_texture_source_index = 0;
    const full_source = full_texture.source[full_texture_source_index];
    const full_width = full_source.width;
    const full_height = full_source.height;

    var wings = game.make.renderTexture({
      width: full_width,
      height: full_height,
    }, false);

    wings.draw(flavored_actor);

    const bodyEraser = game.make.graphics();
    bodyEraser.fillStyle(0xffffff, 1);
    bodyEraser.beginPath();
    const factorX = full_width / bodySpec.width;
    const factorY = full_height / bodySpec.height;
    const points = bodySpec.points;
    bodyEraser.moveTo(points[points.length-1][0] * factorX, points[points.length-1][1] * factorY);
    points.forEach((point) => {
      bodyEraser.lineTo(point[0], point[1]);
    });
    bodyEraser.closePath();
    bodyEraser.fillPath();
    wings.erase(bodyEraser);
    wings.saveTexture(flavored_actor + '-wings');

    var body = game.make.renderTexture({
      width: full_width,
      height: full_height,
    }, false);

    body.draw(flavored_actor);

    var eraser = game.make.renderTexture({
      width: full_width,
      height: full_height,
    }, false);
    eraser.fill(0xffffff, 1);
    eraser.erase(bodyEraser);

    body.erase(eraser);
    body.saveTexture(flavored_actor + '-body');
  }
}
