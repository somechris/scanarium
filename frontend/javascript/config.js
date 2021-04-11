var default_global_config = {
  // How often (in milliseconds) to reload the actor configs
  'actor-reload-period': 10 * 1000,

  // How often (in milliseconds) to reload the command log
  'command-log-reload-period': 1 * 1000,

  // Default scene to load, if no `scene` parameter is given.
  'default_scene': 'space',

  // If true, the page insertion hint gets removed after the first actor image
  // got scanned.
  'drop_page_insertion_hint_after_scan': true,
};

var global_config = {};

var scenes_config = []; // Initialized in settings.js
var actor_variants = []; // Initialized in settings.js

function getConfig(key) {
    var ret = default_global_config[key];
    if (key in global_config) {
        ret = global_config[key];
    }
    return ret;
}

var dyn_dir = 'dynamic';
var scenes_dir = 'scenes';

var scene;         // Initialized in boot.js
var scene_dir;     // Initialized in boot.js
var dyn_scene_dir; // Initialized in boot.js

var scanariumConfig = {
    type: Phaser.AUTO,
    width: 0,
    height: 0,
    physics: {
        default: 'arcade',
    },
    scale: {
        mode: Phaser.Scale.RESIZE,
        width: '100%',
        height: '100%',
    },
    scene: {
        // `preload` gets monkey-fixed in game.js
        // `create` gets monkey-fixed in game.js
        // `update` gets monkey-fixed in game.js
    },
    banner: {
        hidePhaser: true,
    },
};
LayoutManager.register(function(width, height) {
  scanariumConfig.width = width;
  scanariumConfig.height = height;
});

// sceneConfig gets loaded dynamically from scene directory
var sceneConfig = {
}

var dynamicConfigMethod = 'GET';

