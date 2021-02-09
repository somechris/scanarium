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
scanariumConfig.scene["preload"] = preload;

function create() {
    // Initing `game` to be save even if create happens to get called before
    // `Phaser.Game` initialization can set it.
    game = this;

    var config = scanariumConfig;

    //  A simple background for our game
    background = this.add.image(0, 0, 'background');
    background.setOrigin(0, 0);
    sendToBack(background);
    LayoutManager.register(function(width, height) {
      background.setScale(width/background.width, height/background.height);
    });

    ScActorManager.init(config);

    scene_create();

    FrameCounter.init();
    PageInsertionHint.init();
    CommandLogInjector.init();
    ScreensaverManager.init();
    PauseManager.init();
    DeveloperInformation.init();

    this.input.keyboard.on('keydown-M', function (event) {
        ScActorManager.addActorRandom();
    });
    this.input.keyboard.on('keydown-C', function (event) {
        FrameCounter.toggleVisibility();
    });
    this.input.keyboard.on('keydown-H', function (event) {
        HelpPage.toggleVisibility();
    });
    this.input.keyboard.on('keydown-D', function (event) {
        DeveloperInformation.toggleVisibility();
    });

    this.scale.on('resize', LayoutManager.onResize, this);
    LayoutManager.onResize();
}
scanariumConfig.scene["create"] = create;

var updateLastTime = 0;
function update (time, delta) {
    // delta is way too often off. Especially, if the tab is in the
    // background. So we compute our own.
    delta = time - updateLastTime;
    FrameCounter.update(time, delta, updateLastTime);
    PageInsertionHint.update(time, delta, updateLastTime);
    DeveloperInformation.update(time, delta, updateLastTime);

    scene_update(time, delta);

    ScActorManager.update(time, delta);

    if (typeof MessageManager !== 'undefined') {
      MessageManager.update(time, delta);
    }

    updateLastTime = time;
}
scanariumConfig.scene["update"] = update;
