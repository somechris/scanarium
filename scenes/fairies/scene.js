// This file is part of Scanarium https://scanarium.com/ and licensed under the
// GNU Affero General Public License v3.0 (See LICENSE.md)
// SPDX-License-Identifier: AGPL-3.0-only

// Scene: fairies

function scene_preload() {
}

function scene_create() {
}

function scene_update(time, delta) {
}

function getBorderPosition(defaultX, defaultY) {
  var width = scanariumConfig.width;
  var height = scanariumConfig.height;

  var x = defaultX;
  var y = defaultY;
  var position = Math.random() * (2 * width + 2 * height);
  if (position < width) {
    x = position;
  } else if (position < width + height) {
    x = width - x;
    y = position - width;
  } else if (position < 2 * width + height) {
    x = 2 * width + height - position;
    y = height - y;
  } else {
    y = 2 * width + 2 * height - position;
  }
  return [x, y];
}

class Wings extends Phaser.Physics.Arcade.Sprite {
  constructor(x, y, image_name, body, minCycleLength, maxCycleLength) {
    super(game, x, y, image_name);

    game.physics.world.enableBody(this);
    game.sys.updateList.add(this);

    this.x = body.x;
    this.y = body.y;
    this.fullWidth = body.width;
    this.fullHeight = body.height;
    this.setOrigin(body.originX, body.originY);
    this.cycleLength = randomBetween(minCycleLength, maxCycleLength);
    this.cycleOffset = randomBetween(0, this.cycleLength);
    this.angleFactor = 100 / 360 * 2 * Math.PI;
    this.update(0, 0);
  }

  update(time, delta) {
    var phase = Math.abs(((time + this.cycleOffset) % this.cycleLength) / (this.cycleLength / 2) - 1);

    // Pushing up factor 0 up to 0.001, as width 0 makes the sprite vanish from
    // the scene, even for later frames with width > 0.
    var currentWidth = tunnel(Math.sin(phase * this.angleFactor), 0.001, 1) * this.fullWidth;
    this.setSize(currentWidth, this.fullHeight);
    this.setDisplaySize(currentWidth, this.fullHeight);
  }
}

class Creature extends Phaser.GameObjects.Container {
  constructor(flavor, x, y, minWidthRef, maxWidthRef, bodySpec, wiggleX, wiggleY, wiggleAngle, minFlapCycleLength, maxFlapCycleLength) {
    super(game, 0, 0);
    this.wiggleX = wiggleX / 2;
    this.wiggleY = wiggleY / 2;
    this.wiggleAngle = wiggleAngle / 2;

    const actor = this.constructor.name;
    var flavored_actor = actor + '-' + flavor;
    this.createTextures(flavored_actor, bodySpec);

    var body = game.add.image(0, 0, flavored_actor + '-body');
    var width = randomBetween(minWidthRef, maxWidthRef) * refToScreen;
    var base_scale = width / body.width;
    var height = body.height * base_scale;
    body.setOrigin(0.5, bodySpec.centerY / bodySpec.height);
    body.setSize(width, height);
    body.setDisplaySize(width, height);
    this.destroyOffset = Math.max(width, height) + 20;

    var wings = new Wings(0, 0, flavored_actor + '-wings', body, minFlapCycleLength, maxFlapCycleLength);
    this.add(wings);
    this.wings = wings;

    this.add(body);
    game.physics.world.enable(this);

    const startPosition = getBorderPosition(-this.destroyOffset + 10, -this.destroyOffset + 10);
    this.x = startPosition[0];
    this.y = startPosition[1];
    this.addTimeline();
  }

  addTimeline() {
    var tweens = [];
    var i;
    var steps = Math.random() * 4 + 3;
    var previousX = this.x;
    var width = scanariumConfig.width;
    var height = scanariumConfig.height;

    // First step is to quickly, but gradually appear at start position
    this.alpha = 0;
    tweens.push({
      duration: randomBetween(100, 200),
      alpha: 1,
    });

    while (tweens.length < steps) {
      var x = randomBetween(0.1, 0.9) * width;
      var y = randomBetween(0.1, 0.9) * height;
      tweens.push({
        x: x,
        y: y,
        duration: randomBetween(1000, 3000),
        hold: randomBetween(100, 1000),
        angle: tunnel((x-previousX) * screenToRef / 100, -15, 15),
      });
      previousX = x;
    }

    // And finally, we add a move to a position that will have the creature
    // evicted and destroyed.
    const endPosition = getBorderPosition(-this.destroyOffset - 10, -this.destroyOffset - 10);
    tweens.push({
      x: endPosition[0],
      y: endPosition[1],
      duration: randomBetween(1000, 3000),
    });

    // When having a destroy position with positive X and Y coordinates, it
    // might be that a window resize made the destroy position a proper
    // position. So we back up with making one coordinate negative. This kills
    // the sprite for good (regargless of window resizes).
    tweens.push({
      x: endPosition[0],
      y: -this.destroyOffset - 10,
      duration: randomBetween(1000, 3000),
    });

    this.timeline = game.tweens.timeline({
      targets: this,
      ease: 'Cubic.easeOut',
      tweens: tweens,
    });
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
      bodyEraser.lineTo(point[0] * factorX, point[1] * factorY);
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

  update(time, delta) {
    this.x += randomBetween(-this.wiggleX, this.wiggleX) * refToScreen;
    this.y += randomBetween(-this.wiggleY, this.wiggleY) * refToScreen;
    this.angle += randomBetween(-this.wiggleAngle, this.wiggleAngle);
    this.wings.update(time, delta);
  }
}
