// Scene: balloons

function scene_preload() {
}

function scene_create() {
    Wind.init();
}

function scene_update(time, delta) {
    Wind.update(time, delta);
}

class BaseBalloon extends Phaser.Physics.Arcade.Sprite {
    constructor(actor, flavor, x, y) {
        super(game, x, scanariumConfig.height + 2000, actor + '-' + flavor);
        game.physics.world.enable(this);
        this.depth = Math.random();
        var scale = scaleBetween(0.4, 1, this.depth);
        var width = this.width * scale;
        var height = this.height * scale;
        this.y = scanariumConfig.height + height/2;
        this.setDisplaySize(width, height);
        this.setSize(width, height);
        this.speedX = 0;
        this.speedY = -20 * (1 + this.depth);
    }

    update(time, delta) {
        this.speedX = tunnel(this.speedX + Wind.getForce(this.y), -10, 10);
        this.setAngle(this.speedX);
        this.setVelocityX(this.speedX);
        this.setVelocityY(this.speedY);
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
