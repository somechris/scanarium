var PauseManager = {
  paused: false,

  init: function() {
    this.resume();
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
  },

  resume: function() {
    this.paused = false;

    if (game != null) {
      game.scene.resume();
    }

    MessageManager.addMessage(null, 'ok', localize('Resuming scene'));
  },
};
