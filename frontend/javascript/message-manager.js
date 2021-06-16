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

  init: function() {
      this.fontStyle.color = getConfig('message-color');
      this.fontStyle.fontFamily = 'sans-serif';
      this.fontStyle.fontStyle = 'bold';
  },

  getMessageTargetY: function(i) {
    var ret = this.offsetY;
    if (i > 0) {
      const prevMessage = this.messages[i - 1];
      if (prevMessage.sprites.length > 2) {
        var prevButton = prevMessage.sprites[2];
        ret = Math.ceil(prevButton.MessageManagerTop + prevButton.MessageManagerTopOffset + computedPxLength(prevButton, 'height'));
      } else {
        var prevTextSprite = prevMessage.sprites[1];
        ret = prevTextSprite.y + prevTextSprite.height;
      }
      ret += this.offsetY * 0.2;
    }
    return ret;
  },

  addButtonToMessage: function(message, caption, callback, extra_params) {
    var button = document.createElement('button');
    button.className = 'message-button';
    var left = (32 * window.devicePixelRatio) + 'px';
    if (message.sprites.length > 2) {
      var lastButton = message.sprites[message.sprites.length - 1];
      button.MessageManagerTopOffset = lastButton.MessageManagerTopOffset;
      button.MessageManagerTop = lastButton.MessageManagerTop;
      left = Math.ceil(computedPxLength(lastButton, 'left') + computedPxLength(lastButton, 'width') + 2*0.2*this.offsetY) + 'px';
    } else {
      const idx = this.messages.indexOf(message);
      button.MessageManagerTop = this.getMessageTargetY(idx);
      button.MessageManagerTopOffset = this.getMessageTargetY(idx + 1) - button.MessageManagerTop;
    }
    button.style['left'] = left;
    button.style['top'] = (button.MessageManagerTop + button.MessageManagerTopOffset) + 'px';
    button.textContent = caption;
    button.lastClick = 0;
    button.onclick = (event) => {
      const now = Date.now();
      if (now - button.lastClick > 400) {
          callback(message, extra_params);
      }
      lastUploadButtonClick = now;
      event.stopPropagation();
      event.preventDefault();
      event.handled_by_scanarium_settings = true;
      return false;
    }
    button.ontouchstart = button.onclick;
    document.body.append(button);

    message.sprites.push(button);
  },

  addMessage: function(message, icon, is_long, uuid) {
    var ret = null;
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
      ret = {'sprites': sprites, duration: duration, expire: null, uuid: uuid};
      this.messages.push(ret);
    }
    return ret;
  },

  update: function(time, delta) {
    var len = this.messages.length;
    var i;
    var no_evicted_uuid_yet = true;
    for (i=len - 1; i >= 0; i--) {
      var message = this.messages[i];
      if (message.expire == null) {
        message.expire = time + message.duration;
      }

      if (message.expire <= time) {
        this.messages.splice(i, 1);
        message.sprites.forEach(sprite => {
          if (isPhaserGameObject(sprite)) {
            sprite.destroy();
          } else {
            sprite.remove();
          }
        });

        // If two or more evictions take place in this method, we only need to
        // track the first one, as we iterate from newest to oldest message.
        // So we guard updating `lastEvictedUuid` by `no_evicted_uuid_yet`.
        if (message.uuid && no_evicted_uuid_yet) {
          this.lastEvictedUuid = message.uuid;
          no_evicted_uuid_yet = false;
        }
      } else {
        var targetY = this.getMessageTargetY(i);
        message.sprites.forEach(sprite => {
          if (isPhaserGameObject(sprite)) {
            sprite.y = Math.max(sprite.y - Math.min(delta, 1000)/25, targetY);
          } else {
            const currentTop = sprite.MessageManagerTop;
            const newTop = Math.max(currentTop - Math.min(delta, 1000)/25, targetY);
            if (currentTop != newTop) {
              sprite.MessageManagerTop = newTop;
              sprite.style['top'] = (newTop + sprite.MessageManagerTopOffset) + 'px';
            }
          }
        });
      }
    }
  },
};

