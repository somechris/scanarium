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

class Vehicle extends Phaser.GameObjects.Container {
    constructor(actor, flavor, x, y, width) {
        var lane = lanes[tunnel(Math.floor(Math.random()*lanes.length), 0, lanes.length-1)];
        var x = lane.leftToRight ? 0 : scanariumConfig.width;
        var y = lane.y * scanariumConfig.height;
        super(game, x, y);

        this.setDepth(lane.scale*100);
        var body = game.add.image(0, 0, actor + '-' + flavor);
        var width = width * lane.scale * refToScreen;
        var height = body.height / body.width * width;
        body.setFlipX(lane.leftToRight);
        body.setOrigin((lane.leftToRight ? 1 : 0), 1);
        body.setSize(width, height);
        body.setDisplaySize(width, height);
        this.destroyOffset = width;
        this.add([body]);
        this.vehicle_body = body;

        game.physics.world.enable(this);

        var speed = (Math.random()+1) * 100 * lane.speedFactor * refToScreen;
        this.body.setVelocityX(speed);
    }

    update(time, delta) {
    }
}
