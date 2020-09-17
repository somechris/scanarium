var scene = 'space';

var scene_dir = 'scenes/' + scene;

var dyn_scene_dir = 'dynamic/scenes/' + scene;

var scanariumConfig = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    spawnPeriod: 2500,
    physics: {
        default: 'arcade',
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var backgroundWidth=1600;
var backgroundHeight=1200;

var configReloadPeriod = 10 * 1000; // 10 seconds

var game = new Phaser.Game(scanariumConfig);

var degToRadian = 2 * Math.PI / 360;

function preload ()
{
    this.load.image('background', scene_dir + '/background.png');
    this.load.spritesheet('spaceship-thrust', scene_dir + '/spaceship-thrust.png', { frameWidth: 600, frameHeight: 200 });

    ScActorManager.reloadConfigFiles(this, true);
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

function scaleBetween(min, max, scale) {
    return (max - min) * scale + min;
}

var SimpleRocket = {
    game: null,
    sprite: null,
    imgAspect: 1.455814,
    angle: 180,
    speed: 10,
    lengthMin: 50,
    lengthMax: 350,
    nextMotionPlanningUpdate: 0,

    init: function(game, x, y, flavor) {
        console.log('Init');
        this.game = game;

        this.scale = Math.pow(Math.random(), 5);

        this.length = scaleBetween(this.lengthMin, this.lengthMax, this.scale);
        this.width = this.length / this.imgAspect;

        var container = game.add.container(x, y);
        this.container = container;

        var ship = game.add.image(0, 0, 'SimpleRocket-' + flavor);
        ship.setSize(this.length, this.width);
        ship.setDisplaySize(this.length, this.width);
        ship.angle = 180;
        this.ship = ship;
        this.container.add([this.ship]);

        game.physics.world.enable(this.container);

        var speed = Math.random() * 40;
        var angle = Math.random() * 2 * Math.PI;
        this.speedX = Math.cos(angle) * speed
        this.speedY = Math.sin(angle) * speed
        this.container.angle = Math.random() * 360
        this.container.body.setVelocityX(this.speedX);
        this.container.body.setVelocityY(this.speedY);

        var thrustScale = scaleBetween(0.08, 0.7, this.scale);
        this.nozzleLeft = Object.create(SpaceshipThrust);
        this.container.add([this.nozzleLeft.init(this.game, this, -this.length*0.41, -this.width/2, 90, thrustScale)]);

        this.nozzleMiddle = Object.create(SpaceshipThrust);
        this.container.add([this.nozzleMiddle.init(this.game, this, -this.length/2, 0, 0.01, thrustScale)]);

        this.nozzleRight = Object.create(SpaceshipThrust);
        this.container.add([this.nozzleRight.init(this.game, this, -this.length*0.41, this.width/2, -90, thrustScale)]);

        this.nextMotionPlanningUpdate = 0;
    },

    update: function(time, delta) {
        if (time > this.nextMotionPlanningUpdate) {
            if (Math.random() > 0.5) {
                this.nozzleLeft.setThrust(0);
                this.nozzleRight.decideThrust();
            } else {
                this.nozzleLeft.decideThrust();
                this.nozzleRight.setThrust(0);
            }
            this.nozzleMiddle.decideThrust();

            this.nextMotionPlanningUpdate = time + scaleBetween(100, 10000, this.scale);
        }
        this.container.angle += this.nozzleRight.thrust - this.nozzleLeft.thrust;

        this.nozzleLeft.update();
        this.nozzleMiddle.update();
        this.nozzleRight.update();

        var angleRad = this.container.angle * degToRadian;
        this.speedX += Math.cos(angleRad) * this.nozzleMiddle.thrust;
        this.speedY += Math.sin(angleRad) * this.nozzleMiddle.thrust;
        this.container.body.setVelocityX(this.speedX);
        this.container.body.setVelocityY(this.speedY);
    },
};

var scActors = [];

var ScActorManager = {
    init: function(game, config) {
        this.game = game;
        this.config = config;
        console.log('ActorManager initialized');
    },
    game: null,
    scene_config: null,
    actors_config: null,
    actors_latest_config: null,
    nextConfigFetch: 0,
    configFetches: 0,

    triedActors: {},
    loadedActors: {},

    update: function(time, delta) {
        if (time > this.nextConfigFetch) {
            this.nextConfigFetch = time + configReloadPeriod;
            this.reloadConfigFiles(this.game);
        }
    },

    reloadConfigFiles: function(game, isPreload) {
        game.load.json('actors-latest-config', dyn_scene_dir + '/actors-latest.json');
        if ((ScActorManager.configFetches % 60) == 0) {
        game.load.json('actors-config', dyn_scene_dir + '/actors.json');
        }

        if (isPreload === true) {
            var file = game.load.json('scene-config', dyn_scene_dir + '/scene.json');
            file.on('filecomplete', ScActorManager.configFileLoaded, this);
        } else {
            game.load.start();
        }

        ScActorManager.configFetches++;
    },

    configFileLoaded: function(key, file) {
        console.log('loaded ' + key);
        if (key == 'scene-config') {
            this.scene_config = game.cache.json.get(key);
            console.log(this.scene_config);
        }

        if (key == 'actors-config') {
            this.actors_config = game.cache.json.get(key);
            console.log(this.actors_config);
            game.cache.json.remove(key);
        }

        if (key == 'actors-latest-config') {
            this.actors_latest_config = game.cache.json.get(key);
            console.log(this.actors_latest_config);
            game.cache.json.remove(key);
        }
    },

    addLoadedActor: function(flavor) {
        var x = this.config.width * (Math.random() * 0.6 + 0.2);
        var y = this.config.height * (Math.random() * 0.6 + 0.2);

        var actor = Object.create(SimpleRocket);
        actor.init(game, x, y, flavor);
        scActors.push(actor);
    },

    getNewActorNameWithFlavorFromConfig: function(config, forceUntried) {
        // We iterate over all entries in actors_latest_config.
        // If we find one that we have not tried yet, we try it.
        // If we have already tried all, we pick a random one.
        var all = [];
        var names = Object.keys(config['actors']);
        var i;
        for (i=0; i < names.length; i++) {
            var flavors = config['actors'][names[i]];
            var j;
            for (j=0; j < flavors.length; j++) {
                item = [names[i], flavors[j]];
                if (forceUntried) {
                    if (names[i] in this.triedActors) {
                        if (!(this.triedActors[names[i]].includes(flavors[j]))) {
                            return item;
                        }
                    } else {
                        return item;
                    }
                }
                all.push(item);
            }
        }
        return all[Math.floor(Math.random() * all.length)];
    },

    getNewActorNameWithFlavor: function() {
        var config = this.actors_latest_config
        var forceUntried = true;
        if (Math.random() < 0.3) {
            config = this.actors_config
            forceUntried = false;
        }
        return this.getNewActorNameWithFlavorFromConfig(config, forceUntried);
    },

    addActor: function() {
        if (this.game) {
            var actor_spec = this.getNewActorNameWithFlavor();

            var actor_name = actor_spec[0];
            var flavor = actor_spec[1];

            var flavored_actor_name = actor_name + '-' + flavor;

            var triedActors = this.triedActors;
            if (!(actor_name in triedActors)) {
                triedActors[actor_name] = []
            }
            if (!(triedActors[actor_name].includes(flavor))) {
                triedActors[actor_name].push(flavor);
            }

            var loadedActors = this.loadedActors;
            if (!(actor_name in loadedActors)) {
                loadedActors[actor_name] = []
            }

            var created = false;
            var that = this;
            var image = null;

            var onLoaded = function(key, file) {
                if (key == flavored_actor_name) {
                    if (!(that.loadedActors[actor_name].includes(flavor))) {
                        that.loadedActors[actor_name].push(flavor);
                    }

                    if (image != null) {
                        that.game.events.off('filecomplete', onLoaded);
                    }

                    that.addLoadedActor(flavor);
                }
            };

            if (loadedActors[actor_name].includes(flavor)) {
                onLoaded(flavored_actor_name);
            } else {
                var path = dyn_scene_dir + '/actors/' + actor_name + '/' + flavor + '.png';
                image = this.game.load.image(flavored_actor_name, path);
                image.on('filecomplete', onLoaded, this);
                this.game.load.start()
            }
        }
    }
}

function create() {
    var config = scanariumConfig;

    //  A simple background for our game
    background = this.add.image(0, 0, 'background');
    background.setOrigin(0, 0);
    background.setScale(config.width/backgroundWidth, config.height/backgroundHeight);

    ScActorManager.init(this, config);

    this.anims.create({
        key: 'spaceship-thrust-fire',
        frames: this.anims.generateFrameNumbers('spaceship-thrust', { start: 0, end: 2 }),
        frameRate: 60,
        repeat: -1
    });

    game = this;
    this.input.keyboard.on('keydown_M', function (event) {
        ScActorManager.addActor();
    });
}

var nextSpawn = 0;

function update (time, delta) {
    if (time > nextSpawn) {
        ScActorManager.addActor();
        nextSpawn = time + scanariumConfig['spawnPeriod']
    }

    ScActorManager.update(time, delta);

    scActors.forEach(function (scActor, index) {
        scActor.update(time, delta);
    });
}
