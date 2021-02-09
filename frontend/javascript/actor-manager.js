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

    getActorCount: function(actorName) {
      var ret = 0;
      this.actors.forEach(function (actor, index) {
        if (actorName == actor.actorName) {
          ret += 1;
        }
      });
      return ret;
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
    },

    actorInfo: function() {
      return 'ActorManager: actors: ' + ScActorManager.actors.length;
    }
};
DeveloperInformation.register(ScActorManager.actorInfo);
