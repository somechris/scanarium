var PauseManager = {
  paused: false,

  init: function() {
    this.resume(true);
  },

  toggle: function() {
    if (PauseManager.paused) {
      PauseManager.resume();
    } else {
      PauseManager.pause();
    }
  },

  pause: function() {
    this.paused = true;

    if (game != null) {
      game.scene.pause();
    }

    MessageManager.addMessage(localize('Paused'), 'pause');

    SettingsButton.show();
    UploadButton.show();

    ScreensaverManager.allowSleep();
  },

  resume: function(silent) {
    this.paused = false;

    if (typeof silent == 'undefined') {
      silent = false;
    }

    if (game != null) {
      game.scene.resume();
    }

    UploadButton.hide();
    SettingsButton.hide();
    Settings.hide();

    if (!silent) {
      MessageManager.addMessage(localize('Resuming scene'), 'ok');
    }

    ScreensaverManager.keepWoken();
  },
};
