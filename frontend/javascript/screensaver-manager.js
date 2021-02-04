var PhonyScreensaverBackend = {
  init: function() {
  },

  lock: function() {
  },

  unlock: function() {
  },
}

var ScreensaverManager = {
  allowed: true,
  backend: PhonyScreensaverBackend,

  init: function() {
    this.backend.init();
    this.allow();

    document.addEventListener('visibilitychange', this._visibilitychange);
    document.addEventListener('fullscreenchange', this._visibilitychange);
  },

  _visibilitychange: function() {
    if (document.visibilityState === 'visible') {
      ScreensaverManager._applySettings();
    }
  },

  _applySettings: function() {
    if (this.allowed) {
      this.backend.unlock();
    } else {
      this.backend.lock();
    }
  },

  allow: function() {
    this.allowed = true;
    this._applySettings();
  },

  prohibit: function() {
    this.allowed = false;
    this._applySettings();
  },
};

