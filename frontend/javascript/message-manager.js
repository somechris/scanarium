var MessageManager = {
  objects: [],
  offsetY: 10 * window.devicePixelRatio,
  spaceY: 22 * window.devicePixelRatio,
  fontStyle: {
        fontSize: Math.ceil(16*window.devicePixelRatio).toString() + 'px',
        wordWrap: {
            width: Math.floor(scanariumConfig.width * 0.95 - 32 * window.devicePixelRatio),
        },
    },

  getTargetY: function(i) {
    var ret = this.offsetY;
    if (i >= 2) {
      var prevTextIdx = Math.floor(i/2 - 1) * 2 + 1;
      var prevTextSprite = this.objects[prevTextIdx].sprite;
      ret = prevTextSprite.y + prevTextSprite.height + this.offsetY * 0.2;
    }
    return ret;
  },

  addMessage: function(message, icon, uuid) {
    if (game) {
      var y = this.getTargetY(this.objects.length);
      var duration = 10000;
      if (icon == 'ok') {
          duration /= 2;
      } else if (icon == 'pause') {
          duration = 100;
      }
      var len = this.objects.length;
      var sprites = [
          game.add.image(20 * window.devicePixelRatio, y, icon)
            .setScale(window.devicePixelRatio, window.devicePixelRatio)
            .setOrigin(0.6, -0.1),
          game.add.text(32 * window.devicePixelRatio, y, message, this.fontStyle),
      ];
      sprites.forEach((sprite) => {
        bringToFront(sprite);
        this.objects.push({'sprite': sprite, duration: duration, expire: null});
      });
    }
  },

  update: function(time, delta) {
    var len = this.objects.length;
    var i;
    for (i=len - 1; i >= 0; i--) {
      var obj = this.objects[i];
      if (obj.expire == null) {
        obj.expire = time + obj.duration;
      }

      var targetY = this.getTargetY(i);
      var sprite = obj.sprite;
      sprite.y = Math.max(sprite.y - Math.min(delta, 1000)/25, targetY);

      if (obj.expire <= time) {
        this.objects.splice(i, 1);
        sprite.destroy();
      }
    };
  },
};

