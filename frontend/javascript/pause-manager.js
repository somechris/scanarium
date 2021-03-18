var PauseManager = {
  paused: false,

  init: function() {
    this.resume(true);
  },

  toggle: function() {
    if (this.paused) {
      this.resume();
    } else {
      this.pause();
    }
  },

  pause: function() {
    this.paused = true;

    if (game != null) {
      game.scene.pause();
    }

    MessageManager.addMessage(null, 'pause', localize('Paused'));

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

    if (!silent) {
      MessageManager.addMessage(null, 'ok', localize('Resuming scene'));
    }

    ScreensaverManager.keepWoken();
  },
};
