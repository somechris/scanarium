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
  // wakeLock is either null, if there no lock is held. Or if a lock is held,
  // it's either an object with a `release()` method to release the lock, or a
  // promise to such an object.
  wakeLock: null,

  isUsable: function() {
    return 'wakeLock' in navigator && 'request' in navigator.wakeLock;
  },

  init: function() {
    this.allowSleep();
  },

  allowSleep: function() {
    if (this.wakeLock != null) {
      var wakeLock = this.wakeLock;
      this.wakeLock = null;

      try {
        // We opportunistically try if the wakeLock is still a promise.
        wakeLock.then((lock) => lock.release());
      } catch (err) {
        // As `releasing as promise` failed, it's no longer a promise, but
        // already an object. So we release directly on that object.
        wakeLock.release();
      }
    }
  },

  keepWoken: function() {
    if (this.wakeLock == null) {
      try {
        this.wakeLock = navigator.wakeLock.request();
        // At this point, wakeLock is a promes. And we set the promise to
        // replace its value when it's done. That way, `this.wakeLock` always
        // holds a value, if we have a lock.
        this.wakeLock.then(lock => this.wakeLock = lock);
      } catch (err) {
        console.error(`wakeLock request failed. ${err.name}, ${err.message}`);
      }
    }
  },
}
ScreensaverManager.register(10, WakeLockScreensaverBackend);
