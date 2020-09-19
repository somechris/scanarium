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

var configReloadPeriod = 10 * 1000; // 10 seconds

var degToRadian = 2 * Math.PI / 360;

function scaleBetween(min, max, scale) {
    return (max - min) * scale + min;
}

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

    actors: [],
    triedActors: {},
    loadedActors: {},
    registeredActors: {},
    nextSpawn: 0,

    update: function(time, delta) {
        if (time > this.nextConfigFetch) {
            this.nextConfigFetch = time + configReloadPeriod;
            this.reloadConfigFiles(this.game);
        }

        if (time > this.nextSpawn) {
            this.addActorRandom();
            this.nextSpawn = time + scanariumConfig['spawnPeriod']
        }

        var that = this;
        this.actors.forEach(function (actor, index) {
            actor.update(time, delta);

            if ((actor.x < -actor.destroyOffset)
                || (actor.x > actor.destroyOffset + scanariumConfig.width)
                || (actor.y < -actor.destroyOffset)
                || (actor.y > actor.destroyOffset + scanariumConfig.height)) {
                that.deleteActor(actor);
            }
        });
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

    addLoadedActor: function(actor, flavor) {
        var x = this.config.width * (Math.random() * 0.6 + 0.2);
        var y = this.config.height * (Math.random() * 0.6 + 0.2);

        var actor = Object.create(this.registeredActors[actor]);
        actor.init(game, x, y, flavor);
        this.actors.push(actor);
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
        return all.length ? all[Math.floor(Math.random() * all.length)] : null;
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

    addActorRandom: function() {
        if (this.game) {
            var actor_spec = this.getNewActorNameWithFlavor();
            if (actor_spec === null) {
                // Configs currently do not provide good actor configs
                return;
            }

            var actor_name = actor_spec[0];
            var flavor = actor_spec[1];
            this.addActor(actor_name, flavor);
        }
    },

    addActor: function(actor_name, flavor) {
        if (this.game) {
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

                    that.addLoadedActor(actor_name, flavor);
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
    },

    deleteActor(actor) {
        var idx = this.actors.indexOf(actor);
        this.actors.splice(idx, 1);
        actor.destroy();
    },

    registerActor(name, stencil) {
        this.registeredActors[name] = stencil;
    }
}

var MessageManager = {
  objects: [],
  offsetY: 10,
  spaceY: 22,

  addMessage: function(icon, message) {
    if (game) {
      var y = this.offsetY;
      if (this.objects.length > 0) {
        y = this.objects[this.objects.length - 1].sprite.y + this.spaceY;
      }
      var duration = 10000;
      if (icon == 'ok') {
          duration /= 2;
      }
      var len = this.objects.length;
      this.objects.push({'sprite': game.add.image(20, y, icon).setOrigin(0.6, -0.1), duration: duration, expire: null});
      this.objects.push({'sprite': game.add.text(32, y, message), duration: duration, expire: null});
    }
    console.log(message);
  },

  update: function(time, delta) {
    var len = this.objects.length;
    var i;
    for (i=len - 1; i >= 0; i--) {
      var obj = this.objects[i];
      if (obj.expire == null) {
        obj.expire = time + obj.duration;
      }

      var sprite = obj.sprite;
      if (sprite.y > this.offsetY + Math.floor(i/2) * this.spaceY) {
        sprite.y -= Math.min(delta, 1000)/25;
      } else {
        sprite.y = this.offsetY + Math.floor(i/2) * this.spaceY;
      }

      if (obj.expire <= time) {
        this.objects.splice(i, 1);
        sprite.destroy();
      }
    };
  },
};

var JsLoader = {
    files: [],
    loadedFiles: [],
    allAdded: false,
    allLoadedCallback: null,

    load: function(url) {
        this.allAdded = false;
        this.files.push(url);
        var element = document.createElement('script');
        var that = this;
        element.onload = function() {
            that.loadedFiles.push(url);
            if (that.allAdded) {
                that.checkAllFilesLoaded();
            }
        }
        element.src = url;
        document.head.appendChild(element);
    },

    checkAllFilesLoaded: function() {
        if (this.allAdded) {
            this.files.sort();
            this.loadedFiles.sort();

            if (this.files.length != this.loadedFiles.length) {
                return;
            }

            var i;
            for (i=0; i < this.files.length; i++) {
                if (this.files[i] != this.loadedFiles[i]) {
                    return;
                }
            }

            // All elements agree, so we're fully loaded.
            if (this.allLoadedCallback) {
                var callback = this.allLoadedCallback;
                this.allLoadedCallback = null;
                callback();
            }
        }
    },

    whenAllLoaded: function(callback) {
        this.allLoadedCallback = callback;
        this.allAdded = true;
        this.checkAllFilesLoaded();
    }
}


// The Phaser Game itself ------------------------------------------------------

var game;

function preload() {
    this.load.image('failed', '/static/failed.png');
    this.load.image('ok', '/static/ok.png');
    this.load.image('background', scene_dir + '/background.png');

    scene_preload(this);

    ScActorManager.reloadConfigFiles(this, true);
}

function create() {
    var config = scanariumConfig;

    //  A simple background for our game
    background = this.add.image(0, 0, 'background');
    background.setOrigin(0, 0);
    background.setScale(config.width/background.width, config.height/background.height);

    ScActorManager.init(this, config);

    this.anims.create({
        key: 'spaceship-thrust-fire',
        frames: this.anims.generateFrameNumbers('spaceship-thrust', { start: 0, end: 2 }),
        frameRate: 60,
        repeat: -1
    });

    game = this;
    this.input.keyboard.on('keydown_M', function (event) {
        ScActorManager.addActorRandom();
    });
}


function update (time, delta) {
    ScActorManager.update(time, delta);

    if (typeof MessageManager !== 'undefined') {
      MessageManager.update(time, delta);
    }
}

JsLoader.load(scene_dir + '/scene.js');
JsLoader.whenAllLoaded(() => {
    game = new Phaser.Game(scanariumConfig);
});
