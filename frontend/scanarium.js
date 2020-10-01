var scene = 'space';

var scene_dir = 'scenes/' + scene;

var dyn_scene_dir = 'dynamic/scenes/' + scene;

var scanariumConfig = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    physics: {
        default: 'arcade',
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// sceneConfig gets loaded dynamically from scene directory
var sceneConfig = {
}

var configReloadPeriod = 10 * 1000; // 10 seconds

var degToRadian = 2 * Math.PI / 360;

function scaleBetween(min, max, scale) {
    return (max - min) * scale + min;
}

function loadJs(url, callback) {
    var element = document.createElement('script');
    element.onload = callback;
    element.src = url;
    document.head.appendChild(element);
}

function loadJson(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function() {
        if (this.readyState === XMLHttpRequest.DONE) {
            if (this.status == 200) {
                if (typeof callback != 'undefined') {
                    callback(JSON.parse(this.responseText));
                }
            }
        }
    }
    xhr.send();
}

var ScActorManager = {
    init: function(config) {
        this.config = config;
        console.log('ActorManager initialized');
    },
    scene_config: null,
    actors_config: null,
    actors_latest_config: null,
    nextConfigFetch: 0,
    configFetches: 0,

    actors: [],
    triedActors: {},
    loadedActorJavascripts: [],
    loadedActorFlavors: {},
    registeredActors: {},
    nextSpawn: 0,
    lastTime:0,

    update: function(time, delta) {
        // delta is way too often off. Especially, if the tab is in the
        // background. So we compute our own.
        delta = time - this.lastTime;
        this.lastTime = time;

        if (time > this.nextConfigFetch) {
            this.nextConfigFetch = time + configReloadPeriod;
            this.reloadConfigFiles();
        }

        if (time > this.nextSpawn) {
            // In a foreground tab, delta is around 16ms (i.e.: 60 Hz). In a
            // background tab, delta is often way above 10 seconds. So we'd
            // spawn basically every update cycle, while not giving actors
            // frames to move out of the screen. This would lead to a screen
            // that's boastingly full with actors when coming back to a
            // background tab. To avoid that, we only add ships, if the delay is
            // short enough.
            if (delta < 100) {
                this.addActorRandom();
            }
            this.nextSpawn = time + sceneConfig['spawnPeriod']
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

    reloadConfigFiles: function(isPreload) {
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
        if (key == 'scene-config') {
            this.scene_config = game.cache.json.get(key);
        }

        if (key == 'actors-config') {
            this.actors_config = game.cache.json.get(key);
            game.cache.json.remove(key);
        }

        if (key == 'actors-latest-config') {
            this.actors_latest_config = game.cache.json.get(key);
            game.cache.json.remove(key);
        }
    },

    addActorIfFullyLoaded: function(actor, flavor) {
        if (!(this.loadedActorJavascripts.includes(actor))) {
            // JavaScript for actor not yet fully loaded.
            return;
        }
        if (!(this.loadedActorFlavors[actor].includes(flavor))) {
            // Flavor image for actor not yet fully loaded.
            return;
        }

        // Everything's fully loaded, so we're creating and adding the actor

        var x = this.config.width * (Math.random() * 0.6 + 0.2);
        var y = this.config.height * (Math.random() * 0.6 + 0.2);

        var actor = new this.registeredActors[actor](x, y, flavor);
        game.add.existing(actor);
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
        var actor_spec = this.getNewActorNameWithFlavor();
        if (actor_spec === null) {
            // Configs currently do not provide good actor configs
            return;
        }

        var actor_name = actor_spec[0];
        var flavor = actor_spec[1];
        this.addActor(actor_name, flavor);
    },

    addActor: function(actor_name, flavor) {
        var flavored_actor_name = actor_name + '-' + flavor;

        var triedActors = this.triedActors;
        if (!(actor_name in triedActors)) {
            triedActors[actor_name] = []
        }
        if (!(triedActors[actor_name].includes(flavor))) {
            triedActors[actor_name].push(flavor);
        }

        var loadedActorFlavors = this.loadedActorFlavors;
        if (!(actor_name in loadedActorFlavors)) {
            loadedActorFlavors[actor_name] = []
        }

        var created = false;
        var that = this;
        var image = null;

        var onLoaded = function(key, file) {
            if (key == flavored_actor_name) {
                if (!(that.loadedActorFlavors[actor_name].includes(flavor))) {
                    that.loadedActorFlavors[actor_name].push(flavor);
                }

                if (image != null) {
                    game.events.off('filecomplete', onLoaded);
                }

                that.addActorIfFullyLoaded(actor_name, flavor);
            }
        };

        if (this.loadedActorJavascripts.includes(actor_name)) {
            this.addActorIfFullyLoaded(actor_name, flavor);
        } else {
            var actor_url = scene_dir + '/actors/' + actor_name;
            var actor_js_url = actor_url + '/' + actor_name + '.js';
            loadJs(actor_js_url, () => {
                this.loadedActorJavascripts.push(actor_name);
                this.addActorIfFullyLoaded(actor_name, flavor);
            });
        }

        if (!(loadedActorFlavors[actor_name].includes(flavor))) {
            var path = dyn_scene_dir + '/actors/' + actor_name + '/' + flavor + '.png';
            image = game.load.image(flavored_actor_name, path);
            image.on('filecomplete', onLoaded, this);
            game.load.start()
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

var FileLoader = {
    files: [],
    loadedFiles: [],
    allAdded: false,
    allLoadedCallback: null,

    load: function(url, callback) {
        this.allAdded = false;
        this.files.push(url);

        var that = this;
        var urlEnd = url.substring(url.lastIndexOf('.'));
        var wrappedCallback = function(param) {
            if (typeof callback != 'undefined') {
                callback(param);
            }
            that.loadedFiles.push(url);
            if (that.allAdded) {
                that.checkAllFilesLoaded();
            }
        };

        if (urlEnd == '.json') {
            loadJson(url, wrappedCallback);
        } else {
            // default to JavaScript
            loadJs(url, wrappedCallback);
        }
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
    // Initing `game` to be save even if preload happens to get called before
    // `Phaser.Game` initialization can set it.
    game = this;

    this.load.image('failed', '/static/failed.png');
    this.load.image('ok', '/static/ok.png');
    this.load.image('background', scene_dir + '/background.png');

    scene_preload();

    ScActorManager.reloadConfigFiles(true);
}

function create() {
    // Initing `game` to be save even if create happens to get called before
    // `Phaser.Game` initialization can set it.
    game = this;

    var config = scanariumConfig;

    //  A simple background for our game
    background = this.add.image(0, 0, 'background');
    background.setOrigin(0, 0);
    background.setScale(config.width/background.width, config.height/background.height);

    scene_create();

    ScActorManager.init(config);

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

FileLoader.load(scene_dir + '/scene.json', function(json) {sceneConfig = json;});
FileLoader.load(scene_dir + '/scene.js');
FileLoader.whenAllLoaded(() => {
    game = new Phaser.Game(scanariumConfig);
});
