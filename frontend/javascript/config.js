// This file is part of Scanarium https://scanarium.com/ and licensed under the
// GNU Affero General Public License v3.0 (See LICENSE.md)
// SPDX-License-Identifier: AGPL-3.0-only

var default_global_config = {
  // How often (in milliseconds) to reload the actor configs
  'actor-reload-period': 10 * 1000,

  // How often (in milliseconds) to reload the command log
  'command-log-reload-period': 1 * 1000,

  // Default scene to load, if no `scene` parameter is given.
  'default_scene': 'space',

  // Default scene to load, if no `scene` parameter is given.
  'documentation_url': null,

  // Default scene to load, if no `scene` parameter is given.
  'documentation_anchored_error_codes': [],

  // If true, the page insertion hint gets removed after the first actor image
  // got scanned.
  'drop_page_insertion_hint_after_scan': true,

  // If not empty, advertise this email address on the help page for users to
  // reach out to.
  'help_email_address': '',

  // Color to use for on-screen messages.
  'message-color': '#ffffff',

  // If true, make the actor cards in the settings dialog links to pdfs.
  'offer-pdf-downloads': true,

  // Add a prefix to on-screen messages that shows the used method
  'prefix-messages-with-method': false,

  // How often (in milliseconds) to automatically spawn new actors.
  'spawnPeriod': 5000,

  // Title of the Scanarium instance
  'title': 'Scanarium',

  // News sites
  'news': [],

  // Legal Buttons
  'legal-buttons': [],
};

var global_config = {};
var scene_config = {}; // Per-scene config. Initialized in boot.js

var scenes_config = []; // Initialized in settings-page-general.js
var actor_variants = []; // Initialized in settings-page-general.js
var localizations_config = {}; // Initialized in settings-page-administration.js

function getConfig(key, defaultValue) {
    var ret = defaultValue;
    [
        default_global_config,
        global_config,
        scene_config,
    ].forEach(config => {
        if (key in config) {
            ret = config[key];
        }
    });
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

var dynamicConfigMethod = 'GET';

const minimum_password_length = 6;
