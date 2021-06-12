// This file is part of Scanarium https://scanarium.com/ and licensed under the
// GNU Affero General Public License v3.0 (See LICENSE.md)
// SPDX-License-Identifier: AGPL-3.0-only

var MessageManager = {
  messages: [],
  offsetY: 10 * window.devicePixelRatio,
  spaceY: 22 * window.devicePixelRatio,
  fontStyle: {
        fontSize: Math.ceil(16*window.devicePixelRatio).toString() + 'px',
        wordWrap: {
            width: Math.floor(scanariumConfig.width * 0.95 - 32 * window.devicePixelRatio),
        },
    },

  getMessageTargetY: function(i) {
    var ret = this.offsetY;
    if (i > 0) {
      const prevMessage = this.messages[i - 1];
      var prevTextSprite = prevMessage.sprites[1];
      ret = prevTextSprite.y + prevTextSprite.height + this.offsetY * 0.2;
    }
    return ret;
  },

  addMessage: function(message, icon, is_long) {
    if (game) {
      var y = this.getMessageTargetY(this.messages.length);
      var duration = 10000;
      if (typeof icon == 'undefined' || icon == null) {
        icon = 'info';
      }
      if (icon == 'ok' || icon == 'info' || is_long === false) {
          duration /= 2;
      } else if (icon == 'pause') {
          duration = 100;
      }
      var sprites = [
          game.add.image(20 * window.devicePixelRatio, y, icon)
            .setScale(window.devicePixelRatio, window.devicePixelRatio)
            .setOrigin(0.6, -0.1),
          game.add.text(32 * window.devicePixelRatio, y, message, this.fontStyle),
      ];
      sprites.forEach((sprite) => {
        bringToFront(sprite);
      });
      this.messages.push({'sprites': sprites, duration: duration, expire: null});
    }
  },

  update: function(time, delta) {
    var len = this.messages.length;
    var i;
    for (i=len - 1; i >= 0; i--) {
      var message = this.messages[i];
      if (message.expire == null) {
        message.expire = time + message.duration;
      }

      if (message.expire <= time) {
        this.messages.splice(i, 1);
        message.sprites.forEach(sprite => sprite.destroy());
      } else {
        var targetY = this.getMessageTargetY(i);
        message.sprites.forEach(sprite => {
          sprite.y = Math.max(sprite.y - Math.min(delta, 1000)/25, targetY);
        });
      }
    }
  },
};

