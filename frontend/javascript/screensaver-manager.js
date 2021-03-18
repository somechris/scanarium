var PhonyScreensaverBackend = {
  isUsable: function() {
      return true;
  },

  init: function() {
  },

  allowSleep: function() {
  },

  keepWoken: function() {
  },
};

var ScreensaverManager = {
  sleepable: true,
  initialized: false,
  backends: [],
  backend: null,

  init: function() {
    this.backends.sort((a, b) => (b.weight - a.weight));
    this.backends.forEach(item => {
      if (ScreensaverManager.backend == null && item.backend.isUsable()) {
        ScreensaverManager.backend = item.backend;
      }});
    if (this.backend == null) {
        this.backend = PhonyScreensaverBackend;
    }
    this.backend.init();
    this.keepWoken();

    document.addEventListener('visibilitychange', this._visibilitychange);
    document.addEventListener('fullscreenchange', this._visibilitychange);
  },

  _visibilitychange: function() {
    ScreensaverManager._applySettings();
  },

  _applySettings: function() {
    if (this.sleepable || document.visibilityState !== 'visible') {
      this.backend.allowSleep();
    } else {
      this.backend.keepWoken();
    }
  },

  allowSleep: function() {
    this.sleepable = true;
    this._applySettings();
  },

  keepWoken: function() {
    this.sleepable = false;
    this._applySettings();
  },

  register: function(weight, backend) {
    if (this.initialized) {
      console.log('Registering backend after ScreensavecManager initialization', weight, backend);
    }
    this.backends.push({weight: weight, backend: backend});
  },
};

var WakeLockScreensaverBackend = {
  wakeLock: null,

  isUsable: function() {
    return 'wakeLock' in navigator && 'request' in navigator.wakeLock;
  },

  init: function() {
    this.allowSleep();
  },

  allowSleep: function() {
    if (this.wakeLock != null) {
      this.wakeLock.release();
      this.wakeLock = null;
    }
  },

  keepWoken: function() {
    try {
      navigator.wakeLock.request();
    } catch (err) {
      console.error(`wakeLock request failed. ${err.name}, ${err.message}`);
    }
  },
}
ScreensaverManager.register(10, WakeLockScreensaverBackend);
