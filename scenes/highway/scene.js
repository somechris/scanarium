// Scene: highway

var lanes=[];

function add_lane(yMinRef, yMaxRef, leftToRight, scale) {
  var width = (yMaxRef - yMinRef);
  lanes.push({
    // Usable lane width for user-facing vehicle side is only 30% of full lane.
    // This allows for some variability, but still keeping the cars on the
    // expected side of the lane.
    yMinRef: yMinRef + width * 0.1,
    yMaxRef: yMinRef + width * 0.4,
    leftToRight: leftToRight,
    scale: scale,
    vehicles: [], // Vehicles on this lane
  });
}

function relayoutLanes(width, height) {
  lanes.forEach((lane) => {
    lane.vehicles.forEach((vehicle) => vehicle.relayout());
  });
};
LayoutManager.register(relayoutLanes);

function scene_preload() {
}

function scene_create() {
  add_lane(286, 241, false, 0.18);
  add_lane(340, 291, true, 0.2);
  add_lane(514, 425, false, 0.4);
  add_lane(623, 524, true, 0.5);
  add_lane(864, 730, false, 0.9);
  add_lane(1029, 880, true, 1);
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
    constructor(flavor, x, y, initialMinSpeed, initialMaxSpeed, widthRef, tires, undercarriage, angularShake, yShake, decal) {
        var lane = lanes[tunnel(Math.floor(Math.random()*lanes.length), 0, lanes.length-1)];
        var x = lane.leftToRight ? 0 : scanariumConfig.width;

        super(game, x, 0);

        this.setDepth(lane.scale*100);
        const actor = this.constructor.name;
        var image_name = actor + '-' + flavor;
        this.createTextures(image_name, tires, undercarriage, decal);
        var body = game.add.image(0, 0, image_name + '-body');
        const body_unscaled_width = body.width;
        const body_unscaled_height = body.height;

        var width = widthRef * lane.scale * refToScreen;
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
        this.angularShake = angularShake;
        this.yShake = yShake * lane.scale * refToScreen;

        game.physics.world.enable(this);

        if (decal && lane.leftToRight) {
            const decal_sprite = game.add.image(0, 0, image_name + '-decal');
            const decal_width = decal_sprite.width / body_unscaled_width * width;
            const decal_height = decal_sprite.height / body_unscaled_height * height;
            decal_sprite.setOrigin(
                decal.x1 / decal_sprite.width + 1,
                decal.y1 / decal_sprite.height,
            );
            decal_sprite.setSize(decal_width, decal_height);
            decal_sprite.setDisplaySize(decal_width, decal_height);
            this.add(decal_sprite);
            this.decal = decal_sprite;
        }

        var that = this;
        tires.forEach((tire, i) => {
          const coords = this.getTireTextureCoordinates(tire, body_unscaled_width, body_unscaled_height);
          const cx = coords.cx * base_scale * (lane.leftToRight ? -1 : 1);
          const cy = coords.cy * base_scale - body.height;
          var tire = new Tire(cx, cy, image_name + '-tire-' + i);
          tire.setFlipX(lane.leftToRight);
          tire.r = tire.width * base_scale / 2;
          tire.setSize(tire.width * base_scale, tire.height * base_scale);
          tire.setDisplaySize(tire.width * base_scale, tire.height * base_scale);
          that.add(tire);
          that.tires.push(tire);
        });

        // Assigning lane
        this.lane = lane;
        lane.vehicles.push(this);

        // Setting velocity
        this.desired_velocity = randomBetween(initialMinSpeed, initialMaxSpeed) * lane.scale * (lane.leftToRight ? 1 : -1) * refToScreen;
        this.updateVelocity(this.desired_velocity);

        this.yRef = randomBetween(lane.yMinRef, lane.yMaxRef);
        this.relayout();
    }

    relayout() {
      this.y = this.yRef / refHeight * scanariumConfig.height;
    }

    createTextures(image_name, tires, undercarriage, decal) {
      if (!game.textures.exists(image_name + '-body')) {
        this.createTexturesForce(image_name, tires, undercarriage, decal);
      }
    }

    getTireTextureCoordinates(spec, width, height) {
        const x1 = (spec.x1) / spec.w * width;
        const y1 = (spec.y1) / spec.h * height;
        const x2 = (spec.x2 + 1) / spec.w * width;
        const y2 = (spec.y2 + 1) / spec.h * height;

        // We want the tire box coordinates to be integers to avoid the
        // environment rounding the wrong way and making the tires uncentered.
        // So we first determine the tire center in one direction and choose r
        // so the bounds become integers. Only then we choose the center in
        // other direction accordingly.
        //
        // In the typical setting, tires on a vehicle have the same Y specs,
        // but different X coordinates. Would we start with center computation
        // in X direction, then it may be that (due to rounding) the r of two
        // wheels with the same Y but different X specs differ by 0.5. This
        // difference would make one wheel roll slightly slower which makes
        // them look rolling out of sync on screen. So we start by computing
        // the center in Y direction. This way, it's guaranteed that tires
        // with the same Y specs have the same r and hence roll in sync.
        const cy = Math.round(y1 + y2) / 2;
        const r = cy - Math.ceil(y1);
        const cx = Math.floor((x1 + x2) / 2 - r) + r;
        return {
          cx: cx,
          cy: cy,
          r: r,
        };
    }

    createTexturesForce(image_name, tires, undercarriage, decal) {
      const that = this;
      const full_texture = game.textures.get(image_name);
      const full_texture_source_index = 0;
      const full_source = full_texture.source[full_texture_source_index];
      const full_width = full_source.width;
      const full_height = full_source.height;

      var platform = game.make.renderTexture({
        width: full_width,
        height: full_height,
      }, false);

      platform.draw(image_name);

      tires.forEach((spec, i) => {
        const name = 'tire-' + i;

        const tireCoords = that.getTireTextureCoordinates(spec, full_width, full_height);
        const cx = tireCoords.cx;
        const cy = tireCoords.cy;
        const r = tireCoords.r;

        var frameOriginal = full_texture.add(
            name, full_texture_source_index,
            cx - r, cy - r,
            // Bounding width/height by full dimensions to avoid selecting
            // rows/columns outside of the texture, as they duplicate the last
            // row/column and lead to blocky tires.
            Math.min(2 * r, full_width - (cx - r)), Math.min(2 * r, full_height - (cy - r)));

        var tire = game.make.renderTexture({
          width: 2 * r,
          height: 2 * r,
        }, false);

        tire.drawFrame(image_name, name);

        var tireEraser = game.make.renderTexture({
          width: 2 * r,
          height: 2 * r,
        }, false);
        tireEraser.fill(0xffffff, 1);

        var tireEraserEraser = game.make.graphics();
        tireEraserEraser.fillStyle(0xffffff, 1);
        tireEraserEraser.fillCircle(r, r, r);
        tireEraser.erase(tireEraserEraser);

        tire.erase(tireEraser);
        tire.saveTexture(image_name + '-' + name);

        const platformEraser = game.make.graphics();
        platformEraser.fillStyle(0xffffff, 1);
        // We shave off 2 extra pixels to avoid that tire
        // stickouts/misalignments stay visible.
        platformEraser.fillCircle(cx, cy, r + 2);
        platform.erase(platformEraser);
      })

      var body = game.make.renderTexture({
        width: full_width,
        height: full_height,
      }, false);
      undercarriage.forEach((part) => {
        var graph = game.make.graphics();
        graph.fillStyle((typeof (part.color) !== 'undefined') ? part.color : 0x606060, 1);

        const points = part.points;
        const factorX = full_width / part.w;
        const factorY = full_height / part.h;
        graph.moveTo(points[points.length-1][0] * factorX, points[points.length-1][1] * factorY);
        points.forEach((point) => {
          graph.lineTo(point[0] * factorX, point[1] * factorY);
        });
        graph.closePath();
        graph.fillPath();

        body.draw(graph);
      });
      body.draw(platform);
      body.saveTexture(image_name + '-body');

      if (decal) {
        const decal_texture = game.make.renderTexture({
          width: (decal.x2 - decal.x1) / decal.w * full_width,
          height: (decal.y2 - decal.y1) / decal.h * full_height,
        }, false);

        const decalFrame = full_texture.add(
            'decal', full_texture_source_index,
            decal.x1 / decal.w * full_width,
            decal.y1 / decal.h * full_height,
            (decal.x2 - decal.x1) / decal.w * full_width,
            (decal.y2 - decal.y1) / decal.h * full_height,
        );

        decal_texture.drawFrame(image_name, 'decal');
        decal_texture.saveTexture(image_name + '-decal');
      }

    }

    updateVelocity() {
      var velocity = this.desired_velocity;
      const prevVehicleIdx = this.lane.vehicles.indexOf(this) - 1;
      if (prevVehicleIdx >= 0) {
        // There's a car before the current, so we need to brake if we get too
        // close to avoid an accident.
        const prevVehicle = this.lane.vehicles[prevVehicleIdx];

        // The unbounded velocity based on proximity to the previous vehicle
        velocity = (Math.abs(this.x - prevVehicle.x) / prevVehicle.vehicle_body.width - 1) * this.desired_velocity;

        // Applying bounds to the velocity
        velocity = tunnel(velocity, Math.min(0, this.desired_velocity), Math.max(0, this.desired_velocity));
      }

      // Finally, we apply the velocity to the vehicles components
      this.body.setVelocityX(velocity);
      this.tires.forEach((tire) => {
        tire.setAngularVelocity(velocity * 360 / 2 / Math.PI / tire.r);
      });
    }

    update(time, delta) {
      this.vehicle_body.angle = randomBetween(-this.angularShake, this.angularShake);
      this.vehicle_body.y = randomBetween(-this.yShake, this.yShake);
      if (this.decal) {
          this.decal.angle = this.vehicle_body.angle;
          this.decal.y = this.vehicle_body.y;
      }

      this.updateVelocity();
    }

    destroy() {
      // Remove the vehicle reference from the vehicle's lane
      var lane_vehicles = this.lane.vehicles;
      lane_vehicles.splice(lane_vehicles.indexOf(this), 1);

      super.destroy();
    }
}

DeveloperInformation.register(() => {
  var ret = 'lanes: ' + lanes.length;
  lanes.forEach((lane, idx) => {
    ret += ', (lane#' + idx + ': ' + lane.vehicles.length + ' vehicles)';
  });
  return ret;
});
