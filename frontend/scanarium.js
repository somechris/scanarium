if (typeof parameters == 'undefined') {
    parameters = {};
}

var sanitize_resolve = function(value, field) {
    if (typeof(field) != 'undefined') {
        if (typeof(value) == 'object' && field in value) {
            value = value[field];
        } else {
            value = '';
        }
    }
    return value;
}

var sanitize_boolean = function(value, field) {
    value = sanitize_resolve(value, field);
    if (typeof(value) != 'boolean') {
        value = false;
    }
    return value;
}

var sanitize_string = function(value, field) {
    value = sanitize_resolve(value, field) || '';
    if (typeof(value) == 'number') {
        value = value.toString();
    }
    if (typeof(value) != 'string') {
        value = '';
    }

    return value.replace(/[^a-zA-Z0-9_,.:'" {}-]/g, '.');
}

var sanitize_list = function(value, field) {
    var value = sanitize_resolve(value, field);
    var ret = [];
    if (Array.isArray(value)) {
        value.forEach(element => ret.push(sanitize_string(element)));
    }
    return ret;
}

var sanitize_dictionary = function(value, field) {
    var value = sanitize_resolve(value, field);
    if (typeof(value) != 'object' || value == null) {
        value = {};
    }
    var ret = {};
    Object.keys(value).forEach((key, index) => {
        var key_sanitized = sanitize_string(key);
        var value_sanitized = '';
        if (typeof(value[key]) == 'boolean') {
            value_sanitized = sanitize_boolean(value[key]);
        } else {
            value_sanitized = sanitize_string(value[key]);
        }

        ret[key_sanitized] = value_sanitized;
    });

    return ret;
}

function getParameter(name, defaultValue) {
    var ret = defaultValue;
    if (name in parameters) {
        ret = sanitize_string(parameters[name]);
    }
    return ret;
}

function getParameterTrimmedLowerCaseString(name, defaultValue) {
        return String(getParameter(name, false)).toLowerCase().trim();
}

function getParameterBoolean(name, defaultValue) {
    var param = getParameterTrimmedLowerCaseString(name, defaultValue);
    return (param == "1" || param == "true");
}

var scene = getParameter('scene', 'space');

var scene_dir = 'scenes/' + scene;

var dyn_dir = 'dynamic';

var dyn_scene_dir = dyn_dir + '/scenes/' + scene;

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
    },
    banner: {
        hidePhaser: true,
    },
};

// sceneConfig gets loaded dynamically from scene directory
var sceneConfig = {
}

var configReloadPeriod = 10 * 1000; // 10 seconds

var commandReloadPeriod = 1 * 1000; // 3 seconds

var dynamicConfigMethod = 'GET';

var degToRadian = 2 * Math.PI / 360;

function scaleBetween(min, max, scale) {
    return (max - min) * scale + min;
}

function tunnel(value, min, max) {
    return Math.max(Math.min(value, max), min);
}

function loadJs(url, callback) {
    var element = document.createElement('script');
    element.onload = callback;
    element.src = url;
    document.head.appendChild(element);
}

function loadJson(url, callback, method, param) {
    var xhr = new XMLHttpRequest();

    method = (typeof method !== 'undefined') ? method : 'GET';
    xhr.open(method, url, true);
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

    param = (typeof param !== 'undefined') ? JSON.stringify(param) : param;
    xhr.send(param);
}

function loadDynamicConfig(url, callback) {
    var unpack = function(capsule) {
      if (sanitize_boolean(capsule, 'is_ok')) {
        callback(capsule['payload']);
      }
    }

    var wrappedCallback = callback;
    var data;

    if (dynamicConfigMethod == 'POST') {
      wrappedCallback = unpack;
      data = {file: url};
      url = 'cgi-bin/dump-dynamic-config';
    }

    loadJson(url, wrappedCallback, dynamicConfigMethod, data);
}

var ScActorManager = {
    init: function(config) {
        this.config = config;
        console.log(localize('ActorManager initialized'));
    },
    actors_config: null,
    actors_latest_config: null,
    nextConfigFetch: 0,
    configFetches: 0,

    actors: [],
    triedActors: {},
    loadedActorJavascripts: [],
    loadedActorFlavors: {},
    registeredActors: {},
    destroyCallbacks: [],
    nextSpawn: 999999999999999, // This gets reset once configs are loaded.

    update: function(time, delta) {
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

    isConfigLoaded: function() {
      return this.actors_config != null && this.actors_latest_config != null;
    },

    reloadConfigFiles: function() {
        var load = function (url, callback) {
          loadDynamicConfig(dyn_scene_dir + '/' + url, function(payload) {
            var wasLoaded = ScActorManager.isConfigLoaded();

            callback(payload);

            if (!wasLoaded) {
              if (ScActorManager.isConfigLoaded()) {
                ScActorManager.nextSpawn = 0;
              }
            }
          });
        };

        load('actors-latest.json', function(payload) {
          ScActorManager.actors_latest_config = payload;
          });

        if ((ScActorManager.configFetches % 60) == 0) {
          load('actors.json', function(payload) {
            ScActorManager.actors_config = payload;
            });
        }

        ScActorManager.configFetches++;
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
        this.addFullyLoadedActor(actor, flavor);
    },

    addFullyLoadedActor: function(actor, flavor) {
        var x = this.config.width * (Math.random() * 0.6 + 0.2);
        var y = this.config.height * (Math.random() * 0.6 + 0.2);

        var actorName = actor;
        var actor = new this.registeredActors[actor](x, y, flavor);
        if (typeof actor.destroyOffset == 'undefined') {
            actor.destroyOffset = Math.sqrt(actor.displayWidth * actor.displayWidth + actor.displayHeight * actor.displayHeight);
        }
        actor.actorName = actorName;
        actor.actorFlavor = flavor;
        game.add.existing(actor);
        this.actors.push(actor);
        return actor;
    },

    getNewActorNameWithFlavorFromConfig: function(config, forceUntried) {
        // We iterate over all entries in actors_latest_config.
        // If we find one that we have not tried yet, we try it.
        // If we have already tried all, we pick a random one.
        var all = [];
        var names = Object.keys(config != null ? config['actors'] : []);
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
        var config = this.actors_latest_config;
        var forceUntried = true;
        if (Math.random() < 0.3) {
            config = this.actors_config;
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
        this.destroyCallbacks.forEach(function (callbackConfig) {
            if (callbackConfig.actor == null || callbackConfig.actor == actor.actorName) {
                callbackConfig.callback(actor);
            }
        });
        actor.destroy();
    },

    onActorDestroy(callback, actor) {
        if (typeof actor === 'undefined') {
            actor == null;
        }
        this.destroyCallbacks.push({
            callback: callback,
            actor: actor
        });
    },

    registerActor(name, stencil) {
        this.registeredActors[name] = stencil;
    }
}

var MessageManager = {
  objects: [],
  offsetY: 10 * window.devicePixelRatio,
  spaceY: 22 * window.devicePixelRatio,
  fontStyle: {
        fontSize: Math.ceil(16*window.devicePixelRatio).toString() + 'px',
        wordWrap: {
            width: Math.floor(scanariumConfig.width * 0.95 - 32 * window.devicePixelRatio),
        },
    },

  getTargetY: function(i) {
    var ret = this.offsetY;
    if (i >= 2) {
      var prevTextIdx = Math.floor(i/2 - 1) * 2 + 1;
      var prevTextSprite = this.objects[prevTextIdx].sprite;
      ret = prevTextSprite.y + prevTextSprite.height + this.offsetY * 0.2;
    }
    return ret;
  },

  addMessage: function(uuid, icon, message) {
    if (game) {
      var y = this.getTargetY(this.objects.length);
      var duration = 10000;
      if (icon == 'ok') {
          duration /= 2;
      } else if (icon == 'pause') {
          duration = 100;
      }
      var len = this.objects.length;
      var sprites = [
          game.add.image(20 * window.devicePixelRatio, y, icon)
            .setScale(window.devicePixelRatio, window.devicePixelRatio)
            .setOrigin(0.6, -0.1),
          game.add.text(32 * window.devicePixelRatio, y, message, this.fontStyle),
      ];
      sprites.forEach((sprite) => {
        sprite.setDepth(999999);
        this.objects.push({'sprite': sprite, duration: duration, expire: null});
      });
    }
  },

  update: function(time, delta) {
    var len = this.objects.length;
    var i;
    for (i=len - 1; i >= 0; i--) {
      var obj = this.objects[i];
      if (obj.expire == null) {
        obj.expire = time + obj.duration;
      }

      var targetY = this.getTargetY(i);
      var sprite = obj.sprite;
      sprite.y = Math.max(sprite.y - Math.min(delta, 1000)/25, targetY);

      if (obj.expire <= time) {
        this.objects.splice(i, 1);
        sprite.destroy();
      }
    };
  },
};

var CommandProcessor = {
    recentUuids: [null, null, null, null, null],

    isNew: function(uuid) {
        return (uuid == null || uuid == '' || !(this.recentUuids.includes(uuid)));
    },

    markOld: function(uuid) {
        this.recentUuids.shift();
        this.recentUuids.push(uuid);
    },

    processCommandActor: function(capsule) {
        var is_ok = sanitize_boolean(capsule, 'is_ok');
        var command = sanitize_string(capsule, 'command');
        var parameters = sanitize_list(capsule, 'parameters');

        var template;
        if (is_ok) {
            template = 'Scanned new actor drawing for {actor_name}';
            if (command == scene) {
                var flavor = sanitize_string(capsule.payload, 'flavor')
                if (typeof ScActorManager !== 'undefined') {
                    ScActorManager.addActor(parameters[0], flavor);
                }
            }
        } else {
            template = 'Failed to scan new actor drawing for {actor_name}';
        }
        if (command != scene) {
            template += ' for scene {scene_name}';
        }
        return localize(template, {
            'actor_name': parameters[0],
            'scene_name': command,
        });
    },

    processCommandDebug: function(capsule) {
    },

    processCommandSwitchScene: function(capsule) {
        var is_ok = sanitize_boolean(capsule, 'is_ok');
        var parameters = sanitize_list(capsule, 'parameters');
        if (is_ok) {
            template = 'Switching to scene {scene_name}';
            var params = new URLSearchParams(document.location.search.substring(1));
            params.set('scene', parameters[0]);
            document.location.search = '?' + params.toString();
        } else {
            template = 'Cannot switch to scene {scene_name}';
        }
        return localize(template, {
            'scene_name': parameters[0],
        });
    },

    processCommandSystem: function(capsule) {
        var is_ok = sanitize_boolean(capsule, 'is_ok');
        var parameters = sanitize_list(capsule, 'parameters');
        var template = 'Unknown system command received';
        if (parameters.length > 0) {
          if (parameters[0] == 'poweroff') {
            if (is_ok) {
              template = 'Shutdown initiated';
            } else {
              template = 'Shutdown initiation failed';
            }
          }
        }
        return localize(template);
    },

    processCommandReset: function(capsule) {
        var is_ok = sanitize_boolean(capsule, 'is_ok');
        var parameters = sanitize_list(capsule, 'parameters');
        if (is_ok) {
            template = 'Reset all dynamic content';
            document.location.reload();
        } else {
            template = 'Resetting all dynamic content failed';
        }
        return localize(template);
    },

    processNew: function(capsule, prefix) {
        var is_ok = sanitize_boolean(capsule, 'is_ok');
        var command = sanitize_string(capsule, 'command');
        var parameters = sanitize_list(capsule, 'parameters');
        var msg = '';
        if ('command' in capsule && capsule['command'] != null) {
            msg = localize('{command_name} command ' + (is_ok ? 'ok' : 'failed'),
                           {'command_name': command});

            if (command == 'debug') {
                msg = this.processCommandDebug(capsule) || msg;
            } else if (command == 'reset') {
                msg = this.processCommandReset(capsule) || msg;
            } else if (command == 'switchScene') {
                msg = this.processCommandSwitchScene(capsule) || msg;
            } else if (command == 'system') {
                msg = this.processCommandSystem(capsule) || msg;
            } else {
                msg = this.processCommandActor(capsule) || msg;
            }
        }

        var error_message = sanitize_string(capsule, 'error_message');
        var error_template = sanitize_string(capsule, 'error_template');
        var error_parameters = sanitize_dictionary(capsule, 'error_parameters');
        error_template = error_template || error_message;
        if (error_template) {
            if (msg) {
                msg += ': ';
            }
            msg += localize(error_template, error_parameters);
        }

        var uuid = sanitize_string(capsule, 'uuid');
        if (prefix) {
            msg = prefix + (msg ? (': ' + msg) : '');
        }
        MessageManager.addMessage(uuid, is_ok ? 'ok' : 'failed', msg);
    },

    process: function(capsule, prefix) {
        var uuid = sanitize_string(capsule, 'uuid');
        if (this.isNew(uuid)) {
            this.markOld(uuid);
            this.processNew(capsule, prefix);
        }
    }
}

var CommandLogInjector = {
    injectRunCount: 0,

    init: function() {
        window.setInterval(this.fetchLogs, commandReloadPeriod);
    },

    fetchLogs: function() {
        loadDynamicConfig(dyn_dir + '/command-log.json', CommandLogInjector.injectLogs);
    },

    injectLogs: function(items) {
        CommandLogInjector.injectRunCount += 1;
        if (CommandLogInjector.injectRunCount <= 3) {
            items.forEach(function (item, index) {
                var uuid = sanitize_string(item, 'uuid');
                CommandProcessor.markOld(uuid);
            });
        } else {
            items.forEach(function (item, index) {
                CommandProcessor.process(item);
            });
        }
    },
}

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
    this.load.image('pause', '/static/pause.png');
    this.load.image('background', scene_dir + '/background.png');

    scene_preload();

    ScActorManager.reloadConfigFiles();
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
    background.setDepth = -999999;

    ScActorManager.init(config);

    scene_create();

    FrameCounter.init();
    CommandLogInjector.init();

    this.input.keyboard.on('keydown-M', function (event) {
        ScActorManager.addActorRandom();
    });
    this.input.keyboard.on('keydown-C', function (event) {
        FrameCounter.toggleVisibility();
    });
    this.input.keyboard.on('keydown-H', function (event) {
        HelpPage.toggleVisibility();
    });
}

var HelpPage = {
    sprites: null,
    keys: [
        {key: '---key---', description: '---description---'},
        {key: '?', description: 'Show/hide this help page'},
        {key: 'c', description: 'Show/hide frame counter'},
        {key: 'f', description: 'Switch to fullscreen mode'},
        {key: 'h', description: 'Show/hide this help page'},
        {key: 'm', description: 'Add another random actor'},
        {key: 'n', description: 'Delete all your scanned actors'},
        {key: 'p', description: 'Pause/Resume'},
        {key: 'r', description: 'Reindex actors'},
        {key: 's', description: 'Show camera source image'},
        {key: 'space', description: 'Scan image'},
    ],

    generateSprites: function() {
        var ret = [];
        //var graphics = game.make.graphics({x:0, y:0, add:false});

        var x = window.innerWidth / 20;
        var y = window.innerHeight / 20;
        var width = window.innerWidth * 18 / 20;
        var height = window.innerHeight * 18 / 20;

        var graphics = game.add.graphics(0,0);
        graphics.lineStyle(1, 0xffffff, 1);
        graphics.fillStyle(0x808080, 0.7);
        graphics.fillRect(0, 0, width, height);

        if (game.textures.exists('help_page')) {
            game.textures.remove('help_page');
        }
        graphics.generateTexture('help_page', width, height);
        graphics.destroy();

        var background = game.add.image(x, y, 'help_page');
        background.setOrigin(0,0);

        var caption = game.add.text(x+width, y+height, localize('Help Page'));
        caption.x = x + width/2 - caption.width/2;
        caption.y = y + caption.height;

        var ret = [background, caption];

        var keys = this.keys;

        this.keys.forEach(function (key_spec, index) {
            var key = localize(key_spec['key'])
            var description = localize(key_spec['description'])

            var textY = y + caption.height*(index + 4);

            var text = game.add.text(0, textY, key);
            text.x = x + width/2 - text.width - width / 80;
            ret.push(text);

            text = game.add.text(0, textY, description);
            text.x = x + width/2 + width / 80;
            ret.push(text);
        });

        ret.forEach(function (sprite, index) {
            sprite.setDepth(999999);
        });


        return ret;
    },

    toggleVisibility: function() {
        if (this.sprites == null) {
            this.sprites = this.generateSprites();
        } else {
            this.sprites.forEach(function (sprite, index) {
                sprite.destroy();
            });
            this.sprites = null;
        }
    },
}

var FrameCounter = {
    showFrameCount: false,
    frameCountInterval: 1000, //milli-seconds
    frameCount: 0,
    frameCountSprite: null,

    init: function() {
        if (getParameterBoolean('showFrameCounter', false)) {
            this.toggleVisibility();
        }
    },

    toggleVisibility: function() {
        this.showFrameCount = !(this.showFrameCount);
        if (this.showFrameCount) {
            this.frameCountSprite = game.add.text(32, 32, 'fps: ?');
            this.frameCountSprite.depth = 999999;
        } else {
            if (this.frameCountSprite != null) {
                this.frameCountSprite.destroy();
            }
        }
    },

    update: function(time, delta, lastTime) {
        if (this.showFrameCount) {
            if (Math.floor(lastTime / this.frameCountInterval) == Math.floor(time / this.frameCountInterval)) {
                this.frameCount++;
            } else {
                if (this.frameCountSprite != null) {
                    this.frameCountSprite.setText('fps: ' + this.frameCount);
                }
                this.frameCount=1;
            }
        }
    },
}

var updateLastTime = 0;
function update (time, delta) {
    // delta is way too often off. Especially, if the tab is in the
    // background. So we compute our own.
    delta = time - updateLastTime;
    FrameCounter.update(time, delta, updateLastTime);

    scene_update(time, delta);

    ScActorManager.update(time, delta);

    if (typeof MessageManager !== 'undefined') {
      MessageManager.update(time, delta);
    }

    updateLastTime = time;
}

FileLoader.load(scene_dir + '/scene.json', function(json) {sceneConfig = json;});
FileLoader.load(scene_dir + '/scene.js');
FileLoader.whenAllLoaded(() => {
    game = new Phaser.Game(scanariumConfig);
});
