// This file is part of Scanarium https://scanarium.com/ and licensed under the
// GNU Affero General Public License v3.0 (See LICENSE.md)
// SPDX-License-Identifier: AGPL-3.0-only

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
    if (!this.paused) {
        this._pause();
    }
  },

  _pause: function() {
    this.paused = true;

    if (game != null) {
      game.scene.pause();
    }

    MessageManager.addMessage(localize('Paused'), 'pause');

    SettingsButton.show();
    UploadButton.show();
    ImprintButton.show();

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

    ImprintButton.hide();
    UploadButton.hide();
    SettingsButton.hide();
    Settings.hide();

    if (!silent) {
      MessageManager.addMessage(localize('Resuming scene'), 'ok');
    }

    ScreensaverManager.keepWoken();
  },
};
