// Scene: highway

var lanes=[];

function add_lane(y) {
  lanes.push({y: y});
}

function scene_preload() {
}

function scene_create() {
  add_lane(0.255);
  add_lane(0.300);
  add_lane(0.460);
  add_lane(0.560);
  add_lane(0.780);
  add_lane(0.920);
}

function scene_update(time, delta) {
}

class Vehicle extends Phaser.GameObjects.Container {
    constructor(actor, flavor, x, y, width) {
        var lane = lanes[tunnel(Math.floor(Math.random()*lanes.length), 0, lanes.length-1)];
        var x = scanariumConfig.width;
        var y = lane.y * scanariumConfig.height;
        super(game, x, y);

        var body = game.add.image(0, 0, actor + '-' + flavor);
        var width = width * refToScreen;
        var height = body.height / body.width * width;
        body.setOrigin(0, 1);
        body.setSize(width, height);
        body.setDisplaySize(width, height);
        this.destroyOffset = width;
        this.add([body]);
        this.vehicle_body = body;

        game.physics.world.enable(this);

        var speed = -(Math.random()+1) * 100 * refToScreen;
        this.body.setVelocityX(speed);
    }

    update(time, delta) {
    }
}
