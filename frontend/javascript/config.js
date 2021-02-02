var default_global_config = {
  'default_scene': 'space',
};

var global_config = {};

function getConfig(key) {
  return global_config[key] || default_global_config[key];
}

var dyn_dir = 'dynamic';

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

var configReloadPeriod = 10 * 1000; // 10 seconds

var commandReloadPeriod = 1 * 1000; // 3 seconds

var dynamicConfigMethod = 'GET';

