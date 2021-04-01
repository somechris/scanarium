var DeveloperInformation = {
    sprite: null,
    urlParameter: 'showDeveloperInformation',
    providers: [],
    start: 0,

    init: function() {
        if (getUrlParameterBoolean(this.urlParameter, false)) {
            this.toggleVisibility();
        }
        this.start = Date.now();
    },

    toggleVisibility: function() {
        if (DeveloperInformation.sprite) {
            DeveloperInformation.sprite.destroy();
            DeveloperInformation.sprite = null;
        } else {
            const style =  {
              fontSize: Math.ceil(16 * window.devicePixelRatio).toString() + 'px',
            };
            DeveloperInformation.sprite = game.add.text(0, 0, 'Developer Information', style);
            DeveloperInformation.sprite.setOrigin(0, 1);
            bringToFront(DeveloperInformation.sprite);
            DeveloperInformation.relayout();
        }
        setUrlParameterBoolean(DeveloperInformation.urlParameter, DeveloperInformation.sprite != null);
    },

    formatDuration: function() {
      var duration = Date.now() - this.start;
      var seconds = Math.floor(duration / 1000);
      var total_seconds = seconds;
      var minutes = Math.floor(seconds / 60);
      var hours = Math.floor(minutes / 60);
      var days = Math.floor(hours / 24);
      seconds = seconds % 60;
      minutes = minutes % 60;
      hours = hours % 24;
      return '' + days + 'd ' + hours + 'h ' + minutes + 'm ' + seconds + 's (total: ' + total_seconds + 's)';
    },

    basicInformation: function() {
        var ret = '';
        ret += 'scene: ' + scene;
        ret += ', size: ' + scanariumConfig.width + 'x' + scanariumConfig.height;
        ret += ', language: ' + language;
        ret += ', running since: ' + DeveloperInformation.formatDuration();
        if (game) {
          ret += '\nchildren: ' + game.children.getChildren().length;
          ret += ', textures: ' + game.textures.getTextureKeys().length;
          ret += ', tweens: ' + game.tweens.getAllTweens().length;
        }
        return ret;
    },

    update: function() {
        if (this.sprite) {
            var text = '';
            this.providers.forEach((provider) => {
                if (text.length > 0) {
                   text += '\n';
                }
                text += provider();
            });
            this.sprite.setText(text);
        }
    },

    register: function(provider) {
        this.providers.push(provider);
    },

    relayout: function() {
        if (DeveloperInformation.sprite) {
            DeveloperInformation.sprite.x = 32 * window.devicePixelRatio;
            DeveloperInformation.sprite.y = scanariumConfig.height - 48 * window.devicePixelRatio;
        }
    },
};
DeveloperInformation.register(DeveloperInformation.basicInformation);
LayoutManager.register(DeveloperInformation.relayout);
