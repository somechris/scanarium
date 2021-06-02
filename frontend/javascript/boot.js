// This file is part of Scanarium https://scanarium.com/ and licensed under the
// GNU Affero General Public License v3.0 (See LICENSE.md)
// SPDX-License-Identifier: AGPL-3.0-only

var game;

function boot_step_2() {
    game = new Phaser.Game(scanariumConfig);
}

function boot_step_1(json) {
  global_config = json;

  pruneForbiddenCommandsFromEventMap();

  scene = getUrlParameter('scene', getConfig('default_scene'));
  scene_dir = scenes_dir + '/' + scene;
  dyn_scene_dir = dyn_dir + '/scenes/' + scene;

  FileLoader.load(scene_dir + '/scene.json', function(json) {sceneConfig = json;});
  FileLoader.load(scene_dir + '/scene.js');
  FileLoader.whenAllLoaded(boot_step_2);

  document.title = getConfig('title');
}

function boot_step_0() {
  loadJson(dyn_dir + '/config.json', boot_step_1);
}

boot_step_0();
