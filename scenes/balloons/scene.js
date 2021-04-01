// Scene: balloons

function scene_preload() {
    game.load.image('Cloud-1', scene_dir + '/cloud1.png');
    game.load.image('Cloud-2', scene_dir + '/cloud2.png');
    game.load.image('Cloud-3', scene_dir + '/cloud3.png');
}

function spawnCloud() {
    var flavor = tunnel(Math.floor(Math.random()*3) + 1, 1, 3)
    return ScActorManager.addFullyLoadedActor('Cloud', flavor);
}

function spawnClouds(immediate = false) {
    var existing = ScActorManager.getActorCount('Cloud');
    var target = 20;
    var needed = target - existing;
    for (var i = 0; i < needed; i++) {
        var cloud = spawnCloud();
        if (immediate) {
          cloud.alpha = 1;
          cloud.x = Math.random() * scanariumConfig.width;
        }
    }
}

function scene_create() {
    Wind.init();
    ScActorManager.registerActor(Cloud);
    ScActorManager.onActorDestroy(function(actor) {spawnClouds();}, 'Cloud');
    LayoutManager.register(function() {spawnClouds(true)});
}

function scene_update(time, delta) {
    Wind.update(time, delta);
}

class WindAffectedSprite extends Phaser.Physics.Arcade.Sprite {
    constructor(x, y, flavor, width, minScale, maxScale) {
        super(game);
        const actor = this.constructor.name;
        this.setTexture(actor + '-' + flavor);
        this.setPosition(x, y);
        game.physics.world.enable(this);
        this.depth = Math.random();
        var scale = scaleBetween(minScale, maxScale, this.depth) * refToScreen;
        var height = this.height / this.width * width * scale;
        var width = width * scale;
        this.setDisplaySize(width, height);
        this.setSize(width, height);
        this.setFlipX(Math.random() > 0.5);
        this.destroyOffset = Math.sqrt(width * width + height * height) / 2;
        this.body.setMaxVelocityX(10 * refToScreen);
    }

    update(time, delta) {
        this.setAccelerationX(Wind.getForce(this.y) * 60 * refToScreen)
    }
}

class Cloud extends WindAffectedSprite {
    constructor(x, y, flavor) {
        super(x, y, flavor, 400, 0.2, 0.8);
        this.y = Math.random() * scanariumConfig.height;
        this.x = Math.random() * scanariumConfig.width/2;
        var force = Wind.getForce(this.y);
        if (force <=0) {
            this.x += scanariumConfig.width/2;
        }
        this.setVelocityX(force * 120 * refToScreen);
        this.destroyOffset = this.displayWidth / 2;
        this.alpha = 0;
    }

    update(time, delta) {
        super.update(time, delta);
        this.alpha += 0.01;
    }
}

class BaseBalloon extends WindAffectedSprite {
    constructor(flavor, width, x, y) {
        super(x, y, flavor, width, 0.4, 1);
        this.y = scanariumConfig.height + this.displayHeight/2;
        this.setVelocityY(-20 * (1 + this.depth) * refToScreen);
    }

    update(time, delta) {
        super.update(time, delta);
        this.setAngle(this.body.velocity.x * screenToRef);
    }
}

var Wind = {
    maxForce: 0.1,
    sections: 4,
    reinitPeriod: 10 * 1000,

    init: function() {
        this.minForce = -this.maxForce;
        this.forces = [0];
        var i;
        for (i=1; i<this.sections; i++) {
            this.forces.push(0);
        }
        this.nextReinit = 0;
        this.reinit();
    },

    reinit: function() {
        var i;
        this.forces[0] = this.updateForce(this.forces[0]);
        for (i = 1; i < this.sections; i++) {
            this.forces[i] = this.updateForce((this.forces[i] + this.forces[i-1]) / 2);
        }
    },

    updateForce: function(force) {
        force += scaleBetween(this.minForce, this.maxForce, Math.random()) ;
        force = tunnel(force, this.minForce, this.maxForce);
        return force;
    },

    update: function(time, delta) {
        if (time >= this.nextReinit) {
            this.reinit();
            this.nextReinit = time + this.reinitPeriod;
        }
    },

    getForce: function(y) {
        var sectionWidth = scanariumConfig.height / this.sections;
        var section = tunnel(Math.floor(y / sectionWidth), 0, this.sections-1);
        var sectionScale = tunnel(Math.min(y / sectionWidth - section, 1), 0, 1);
        var minForce = this.forces[section];
        var maxForce = this.forces[Math.min(section+1, this.sections-1)];
        return scaleBetween(minForce, maxForce, sectionScale);
    }
}
