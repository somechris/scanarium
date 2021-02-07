// Scene: highway

var lanes=[];

function add_lane(y, leftToRight, scale) {
  lanes.push({
    y: y,
    leftToRight: leftToRight,
    scale: scale,
    speedFactor: (leftToRight ? 1 : -1) * scale,
  });
}

function scene_preload() {
}

function scene_create() {
  add_lane(0.255, false, 0.18);
  add_lane(0.300, true, 0.2);
  add_lane(0.460, false, 0.4);
  add_lane(0.560, true, 0.5);
  add_lane(0.780, false, 0.9);
  add_lane(0.920, true, 1);
}

function scene_update(time, delta) {
}

class Tire extends Phaser.Physics.Arcade.Sprite {
  constructor(x, y, image_name) {
    super(game, x, y, image_name);

    game.physics.world.enableBody(this);
    game.sys.updateList.add(this);
  }
}

class Vehicle extends Phaser.GameObjects.Container {
    constructor(actor, flavor, x, y, width, tires) {
        var lane = lanes[tunnel(Math.floor(Math.random()*lanes.length), 0, lanes.length-1)];
        var x = lane.leftToRight ? 0 : scanariumConfig.width;
        var y = lane.y * scanariumConfig.height;
        super(game, x, y);

        this.setDepth(lane.scale*100);
        var image_name = actor + '-' + flavor;
        this.createTextures(image_name, tires);
        var body = game.add.image(0, 0, image_name + '-body');
        var width = width * lane.scale * refToScreen;
        var base_scale = width / body.width;
        var height = body.height * base_scale;
        body.setFlipX(lane.leftToRight);
        body.setOrigin((lane.leftToRight ? 1 : 0), 1);
        body.setSize(width, height);
        body.setDisplaySize(width, height);
        this.destroyOffset = width;
        this.add([body]);
        this.vehicle_body = body;
        this.tires = [];

        game.physics.world.enable(this);

        var speed = (Math.random()+1) * 100 * lane.speedFactor * refToScreen;
        this.body.setVelocityX(speed);

        var that = this;
        tires.forEach((tire, i) => {
          const cx = (tire.x1 + tire.x2) / 2 * base_scale * (lane.leftToRight ? -1 : 1);
          const cy = (tire.y1 + tire.y2) / 2 * base_scale - body.height;
          var tire = new Tire(cx, cy, image_name + '-tire-' + i);
          tire.setFlipX(lane.leftToRight);
          tire.r = tire.width * base_scale / 2;
          tire.setSize(tire.width * base_scale, tire.height * base_scale);
          tire.setDisplaySize(tire.width * base_scale, tire.height * base_scale);
          tire.setAngularVelocity(that.body.velocity.x * 360 / 2 / Math.PI / tire.r);
          that.add(tire);
          that.tires.push(tire);
        });
    }

    createTextures(image_name, tires) {
      if (!game.textures.exists(image_name + '-body')) {
        this.createTexturesForce(image_name, tires);
      }
    }

    createTexturesForce(image_name, tires) {
      const full_texture = game.textures.get(image_name);
      const full_texture_source_index = 0;
      const full_source = full_texture.source[full_texture_source_index];
      const full_width = full_source.width;
      const full_height = full_source.height;

      var body = game.make.renderTexture({
        width: full_width,
        height: full_height,
      }, false);

      body.draw(image_name);

      tires.forEach((spec, i) => {
        const name = 'tire-' + i;

        const x1 = (spec.x1 - spec.clearance) / spec.w * full_width;
        const y1 = (spec.y1 - spec.clearance) / spec.h * full_height;
        const x2 = (spec.x2 + spec.clearance) / spec.w * full_width;
        const y2 = (spec.y2 + spec.clearance) / spec.h * full_height;
        const cx = (spec.x1 + spec.x2) / 2 / spec.w * full_width;
        const cy = (spec.y1 + spec.y2) / 2 / spec.h * full_height;
        const r = x2 - cx + 1;

        var frameOriginal = full_texture.add(name, full_texture_source_index, x1, y1, x2 - x1 + 1, y2 - y1 + 1);
        var tire = game.make.renderTexture({
          width: x2 - x1 + 1,
          height: y2 - y1 + 1,
        }, false);

        tire.drawFrame(image_name, name);

        var tireEraser = game.make.renderTexture({
          width: x2 - x1 + 1,
          height: y2 - y1 + 1,
        }, false);
        tireEraser.fill(0xffffff, 1);

        var tireEraserEraser = game.make.graphics();
        tireEraserEraser.fillStyle(0xffffff, 1);
        tireEraserEraser.fillCircle(cx - x1, cy - y1, r);
        tireEraser.erase(tireEraserEraser);

        tire.erase(tireEraser);
        tire.saveTexture(image_name + '-' + name);

        const bodyEraser = game.make.graphics();
        bodyEraser.fillStyle(0xffffff, 1);
        bodyEraser.fillCircle(cx, cy, r);
        body.erase(bodyEraser);
      })

      body.saveTexture(image_name + '-body');
    }

    update(time, delta) {
    }
}
