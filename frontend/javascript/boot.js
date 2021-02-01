var game;

FileLoader.load(scene_dir + '/scene.json', function(json) {sceneConfig = json;});
FileLoader.load(scene_dir + '/scene.js');
FileLoader.whenAllLoaded(() => {
    game = new Phaser.Game(scanariumConfig);
});
